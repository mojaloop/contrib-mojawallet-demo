import { User, KnexUserService } from '../../src/services/user-service'
import Knex = require('knex')

describe('User Services', () => {
  let knex: Knex
  let userService: KnexUserService

  beforeAll(async () => {
    knex = Knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:',
        supportBigNumbers: true
      }
    })

    userService = new KnexUserService(knex)
  })

  beforeEach(async () => {
    await knex.migrate.latest()
  })

  afterEach(async () => {
    await knex.migrate.rollback()
  })

  afterAll(async () => {
    await knex.destroy()
  })

  test('Can store a user', async () => {
    const username = 'Test username'
    try {
      await knex<User>('users').where('username', username).first()
    } catch (error) {
      expect(error).toEqual('sqlite does not support inserting default values. Set the `useNullAsDefault` flag to hide this warning. (see docs http://knexjs.org/#Builder-insert).')
    }
    const user = await userService.store({
      username: 'Test username',
      password: 'Test password'
    })

    expect(user.username).toEqual('Test username')
    expect(user.password).toEqual('Test password')
    expect(user.id).toBeGreaterThan(0)
  })

  test('Can update a user', async () => {
    await knex<User>('users').insert({
      username: 'Test username',
      password: 'Test password'
    })
    const user = await knex<User>('users').where('username', 'Test username').first()
    const updatedUser = await userService.update({
      username: user!.username,
      password: 'A new password'
    })

    expect(user!.username).toEqual(updatedUser.username)
    expect(user!.id).toEqual(updatedUser.id)
    expect(user!.password).not.toEqual(updatedUser.password)
    console.log(updatedUser)
  })

  test('Can fetch by username', async () => {
    await knex<User>('users').insert({
      username: 'Test username',
      password: 'Test password'
    })
    const user = await knex<User>('users').where('username', 'Test username').first()
    const fetchedUser = await userService.getByUsername('Test username')

    expect(user!.username).toEqual(fetchedUser.username)
    expect(user!.id).toEqual(fetchedUser.id)
    expect(user!.password).toEqual(fetchedUser.password)
  })

  test('Can fetch by username', async () => {
    await knex<User>('users').insert({
      username: 'Test username',
      password: 'Test password'
    })
    const user = await knex<User>('users').where('id', 1).first()
    const fetchedUser = await userService.getById(1)

    expect(user!.username).toEqual(fetchedUser.username)
    expect(user!.id).toEqual(fetchedUser.id)
    expect(user!.password).toEqual(fetchedUser.password)
  })
})
