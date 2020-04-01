import config from 'config'
import mongoose from 'mongoose'
import {withLock} from "easylock";
import Global from "../database/models/global";
import createClient from "../utils/redis";
import {cznlock} from "../Manager/LockManager";


async function main() {
  const redisClient = createClient()

  const doubleRedis = async (flag) => {
    // await withLock({key: `locklocklock`, timeOutInMs: 50000}, async () => {
    await cznlock({key: `locklocklock`, lockLeaseTime: 50000}, async () => {
      console.log(`redis - in - ` + flag)
      const val7 = await redisClient.getAsync('k')
      await redisClient.setAsync('k', (parseInt(val7) * 2).toString())
      console.log(`redis - out - ` + flag)
    })
  }

  const doubleMongo = async (flag) => {
    // await withLock({key: `locklocklock`, timeOutInMs: 50000}, async () => {
    await cznlock({key: `locklocklock`, lockLeaseTime: 50000}, async () => {
      console.log(`mongo - in - ` + flag)
      const global7 = await Global.findOne({_id: 'test'})
      const k = global7.shortIdCounter * 2
      // await Global.updateOne({_id: 'test'}, {$set: {shortIdCounter: k}})
      global7.shortIdCounter = k
      // global7.shortIdCounter *= 2
      await global7.save()

      console.log(`mongo - out - ` + flag)
    })
  }

  const redisVal = 10
  const mongoVal = 10
  // 初始化 k, redis 是一个 redis 客户端
  await redisClient.setAsync('k', redisVal.toString())
  await Global.updateOne({_id: 'test'}, {$set: {shortIdCounter: mongoVal}}, {upsert: true})
  // 模拟并发的请求
  await Promise.all([doubleMongo(1), doubleMongo(2), doubleRedis(3), doubleRedis(4)])
  // 打印结果
  console.log(`redisValAfter`, await redisClient.getAsync('k')) //2
  console.log(`mongoValAfter`, (await Global.findOne({_id: 'test'})).shortIdCounter) //2
}

if (!module.parent) {

  mongoose.connect(config.get('database.url'))
  console.log(config.get('database.url'))

  if (false) {
    main()
      .catch((error) => {
        console.error('Got', error)
      })
      .then(() => {
        process.exit()
      })
  } else {
    main()
      .catch((error) => {
        console.error('Got', error)
      })
      .then(() => {
        process.exit()
      })
  }
}
