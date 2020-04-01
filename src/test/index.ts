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


  before(async () => {
    console.log(config.get('redis.host'))
    console.log(config.get('database.url'))

    redisClient = createClient(config.get('redis.host'))
    mongoose.connect(config.get('database.url'))
  })

  beforeEach(async () => {
    await redisClient.setAsync('k', redisVal.toString())
    await Global.updateOne({_id: 'test'}, {$set: {shortIdCounter: mongoVal}}, {upsert: true})
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
    await Promise.all([doubleMongo(1), doubleMongo(2), doubleRedis(3), doubleRedis(4)])

    expect(await redisClient.getAsync('k')).to.equal((10 * 2 * 2).toString())
    expect((await Global.findOne({_id: 'test'})).shortIdCounter).to.equal(10 * 2 * 2)
  })
  it(`use cznlock`, async () => {
    const doubleRedis = async (flag) => {
      // await withLock({key: `locklocklock`, timeOutInMs: 50000}, async () => {
      await cznlock({key: `cznlock`, lockLeaseTime: 50000}, async () => {
        console.log(`redis - in - ` + flag)
        const val7 = await redisClient.getAsync('k')
        await redisClient.setAsync('k', (parseInt(val7) * 2).toString())
        console.log(`redis - out - ` + flag)
      })
    }
    const doubleMongo = async (flag) => {
      await cznlock({key: `cznlock`, lockLeaseTime: 50000}, async () => {
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
    await Promise.all([doubleMongo(1), doubleMongo(2), doubleRedis(3), doubleRedis(4)])

    expect(await redisClient.getAsync('k')).to.equal((10 * 2 * 2).toString())
    expect((await Global.findOne({_id: 'test'})).shortIdCounter).to.equal(10 * 2 * 2)
  })
})
