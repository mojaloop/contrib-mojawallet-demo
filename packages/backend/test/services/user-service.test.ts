/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* Coil
- Cairin Michie <cairin@coil.com>
- Donovan Changfoot <don@coil.com>
- Matthew de Haast <matt@coil.com>
- Talon Patterson <talon.patterson@coil.com>
*****/

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
