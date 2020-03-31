import config from 'config'
import mongoose from 'mongoose'
import {withLock} from "easylock";
import Global from "../database/models/global";
import createClient from "../utils/redis";


async function main() {
  const redisClient = createClient()

  const doubleRedis = async (flag) => {
    await withLock({key: `locklocklock`, timeOutInMs: 50000}, async () => {
      console.log(`redis - in - ` + flag)
      // const global = await Global.findOne({_id: 'test'})
      // const global2 = await Global.findOne({_id: 'test'})
      // const global3 = await Global.findOne({_id: 'test'})
      // const global4 = await Global.findOne({_id: 'test'})
      // const global5 = await Global.findOne({_id: 'test'})
      // const global6 = await Global.findOne({_id: 'test'})
      // const global7 = await Global.findOne({_id: 'test'})
      // const k = global7.shortIdCounter * 2
      // // await Global.updateOne({_id: 'test'}, {$set: {shortIdCounter: k}})
      // global7.shortIdCounter = k
      // // global7.shortIdCounter *= 2
      // await global7.save()

      const val = await redisClient.getAsync('k')
      const val2 = await redisClient.getAsync('k')
      const val3 = await redisClient.getAsync('k')
      const val4 = await redisClient.getAsync('k')
      const val5 = await redisClient.getAsync('k')
      const val6 = await redisClient.getAsync('k')
      const val7 = await redisClient.getAsync('k')
      await redisClient.setAsync('k', (parseInt(val7) * 2).toString())
      // await withLock({key: `redis`, timeOutInMs: 50000}, async () => {
      //   console.log(`in2`)
      //
      //   await redisClient.setAsync('k', (parseInt(val) * 2).toString())
      //   console.log(`out2`)
      //
      // })
      console.log(`redis - out - ` + flag)

    })
  }

  const doubleMongo = async (flag) => {
    await withLock({key: `locklocklock`, timeOutInMs: 50000}, async () => {
      console.log(`mongo - in - ` + flag)
      const global = await Global.findOne({_id: 'test'})
      const global2 = await Global.findOne({_id: 'test'})
      const global3 = await Global.findOne({_id: 'test'})
      const global4 = await Global.findOne({_id: 'test'})
      const global5 = await Global.findOne({_id: 'test'})
      const global6 = await Global.findOne({_id: 'test'})
      const global7 = await Global.findOne({_id: 'test'})
      const k = global7.shortIdCounter * 2
      // await Global.updateOne({_id: 'test'}, {$set: {shortIdCounter: k}})
      global7.shortIdCounter = k
      // global7.shortIdCounter *= 2
      await global7.save()

      // const val = await redisClient.getAsync('k')
      // // const val2 = await redisClient.getAsync('k')
      // // const val3 = await redisClient.getAsync('k')
      // // const val4 = await redisClient.getAsync('k')
      // // const val5 = await redisClient.getAsync('k')
      // // const val6 = await redisClient.getAsync('k')
      // // const val7 = await redisClient.getAsync('k')
      // await redisClient.setAsync('k', (parseInt(val) * 2).toString())
      // await withLock({key: `redis`, timeOutInMs: 50000}, async () => {
      //   console.log(`in2`)
      //
      //   await redisClient.setAsync('k', (parseInt(val) * 2).toString())
      //   console.log(`out2`)
      //
      // })
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
