import Redis from 'ioredis'
import RedisLock from "../utils/RedisLock";

const lockClient = new RedisLock(new Redis(6379, 'localhost'), {lockLeaseTime: 15000, retryTimeOut: 1000})

export type LockConfig = {
  key: string
  retryTimeOut?: number
  lockLeaseTime?: number
}

const LOCK_KEY = `locks:`

export const cznlock = async (lockConfig: string | LockConfig, fn) => {

  let key = LOCK_KEY
  let retryTimeOut = 0
  let lockLeaseTime = 0

  if (typeof lockConfig === 'string') {
    key += lockConfig
  } else {
    key += lockConfig.key
    retryTimeOut = lockConfig.retryTimeOut
    lockLeaseTime = lockConfig.lockLeaseTime
  }
  const {value} = await lockClient.lock(key, retryTimeOut, lockLeaseTime)

  try {
    return await fn()
  } catch (err) {
    throw new Error(err)
  } finally {
    const unLock = await lockClient.unLock(key, value)
    console.log('unLock: ', key, value, unLock)
  }
}
