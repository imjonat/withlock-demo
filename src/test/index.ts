import config from 'config'
import mongoose from 'mongoose'
import {withLock} from "easylock";
import Global from "../database/models/global";
import createClient from "../utils/redis";
import {cznlock} from "../Manager/LockManager";
import {expect} from 'chai';

describe('normal test', async () => {
  const redisVal = 10
  const mongoVal = 10
  let redisClient = null
  const testCount = 50
  let count = 0
  let run  = []


  before(async () => {
    console.log(config.get('redis.host'))
    console.log(config.get('database.url'))

    redisClient = createClient(config.get('redis.host'))
    mongoose.connect(config.get('database.url'))
  })

  beforeEach(async () => {
    await redisClient.setAsync('k', redisVal.toString())
    await Global.updateOne({_id: 'test'}, {$set: {shortIdCounter: mongoVal}}, {upsert: true})

    count = testCount
    run  = []

  })

  after(() => {

  });

  it(`use easylock`, async () => {
    const doubleRedis = async (flag) => {
      await withLock({key: `easylock`, timeOutInMs: 50000}, async () => {
        console.log(`redis - in - ` + flag)
        const val7 = await redisClient.getAsync('k')
        await redisClient.setAsync('k', (parseInt(val7) * 2).toString())
        console.log(`redis - out - ` + flag)
      })
    }
    const doubleMongo = async (flag) => {
      await withLock({key: `easylock`, timeOutInMs: 50000}, async () => {
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
    let rate = 1
    while (count > 0){
      run.push(doubleMongo(count), doubleRedis(count))
      rate *= 2
      count--
    }

    await Promise.all(run)

    expect(await redisClient.getAsync('k')).to.equal((redisVal * rate).toString())
    expect((await Global.findOne({_id: 'test'})).shortIdCounter).to.equal(mongoVal * rate)
  })
  it(`use cznlock`, async () => {
    const doubleRedis = async (flag) => {
      // await withLock({key: `locklocklock`, timeOutInMs: 50000}, async () => {
      await cznlock(`cznlock`, async () => {
        console.log(`redis - in - ` + flag)
        const val7 = await redisClient.getAsync('k')
        await redisClient.setAsync('k', (parseInt(val7) * 2).toString())
        console.log(`redis - out - ` + flag)
      })
    }
    const doubleMongo = async (flag) => {
      await cznlock(`cznlock`, async () => {
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
    let rate = 1
    while (count > 0){
      run.push(doubleMongo(count), doubleRedis(count))
      rate *= 2
      count--
    }

    await Promise.all(run)

    expect(await redisClient.getAsync('k')).to.equal((redisVal * rate).toString())
    expect((await Global.findOne({_id: 'test'})).shortIdCounter).to.equal(mongoVal * rate)
  })
})
