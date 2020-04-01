export type LockConfig = {
  lockLeaseTime?: number
  retryTimeOut?: number
  expiryMode?: string
  setMode?: string
};

function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(function () {
      resolve();
    }, time || 1000);
  });
}

export default class RedisLock {
  private readonly lockLeaseTime: number
  private readonly retryTimeOut: number
  private expiryMode: string
  private setMode: string
  private client: any

  /**
   * 初始化 RedisLock
   * @param {*} client
   * @param {*} options 锁默认设置
   */
  constructor(client, options: LockConfig = {}) {
    if (!client) {
      throw new Error('client 不存在');
    }

    if (client.status !== 'connecting') {
      throw new Error('client 未正常链接');
    }

    this.retryTimeOut = options.retryTimeOut || 500; // 默认重试间隔 500ms
    this.lockLeaseTime = options.lockLeaseTime || 3000; // 默认锁过期间隔 3000ms

    this.expiryMode = options.expiryMode || 'EX';
    this.setMode = options.setMode || 'NX';
    this.client = client;
  }

  /**
   * 上锁
   * @param {*} key
   * @param retryTimeOut 重新尝试加锁时间ms
   * @param {*} expire  锁最长过期时间ms
   */
  async lock(key, retryTimeOut = 0, expire = 0) {
    const start = Date.now();
    const retry = retryTimeOut || this.retryTimeOut
    const lease = expire || this.lockLeaseTime
    let val = 0
    const self = this;

    return (async function intranetLock() {
      try {
        val = Date.now() + lease
        const result = await self.client.set(key, val, self.expiryMode, lease / 1000, self.setMode);

        // 上锁成功
        if (result === 'OK') {
          console.log(`${key} ${val} 上锁成功`)
          return {ok: true, value: val}
        }

        // 锁超时
        if ((Date.now() - start) > lease) {
          console.log(`${key} ${val} 上锁重试超时结束`)
          return {ok: false, value: val}
        }

        // 循环等待重试
        console.log(`${key} ${val} 等待 ${retry}ms 重试`)
        await sleep(retry)
        console.log(`${key} ${val} 开始重试`)

        return intranetLock()
      } catch (err) {
        throw new Error(err)
      }
    })()
  }

  /**
   * 释放锁
   * @param {*} key
   * @param {*} val
   */
  async unLock(key, val) {
    const self = this;
    // const script = "if redis.call('get',KEYS[1]) == ARGV[1] then" +
    //   "   return redis.call('del',KEYS[1]) " +
    //   "else" +
    //   "   return 0 " +
    //   "end";
    const del = async () => {
      if ((await self.client.call('get', key)) == val)
        return await self.client.call('del', key)
      else
        return 0
    }

    try {
      // const result = await self.client.eval(script, 1, key, val);
      const result = await del()

      return result === 1;

    } catch (err) {
      throw new Error(err)
    }
  }
}
