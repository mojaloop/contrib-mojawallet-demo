/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the License) and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Coil
 - Cairin Michie <cairin@coil.com>
 - Donovan Changfoot <don@coil.com>
 - Matthew de Haast <matt@coil.com>
 - Talon Patterson <talon.patterson@coil.com>
 --------------
 ******/

import Knex = require('knex')

export type UserProps = {
  username: string;
  password: string;
}

export type User = {
  username: string;
  password: string;
  id: number;
  createdAt: number;
  updatedAt: number;
}

interface UserService {
  store(user: UserProps): Promise<User>;
  update(user: UserProps): Promise<User>;
  getAll(): Promise<Array<User>>
//   delete(id: string): Promise<void>;
//   get(id: string): Promise<User>;
}

export class KnexUserService implements UserService {
  private _knex: Knex
  constructor (knex: Knex) {
    this._knex = knex
  }

  async store (user: UserProps): Promise<User> {
    try {
      const insertedUserId = await this._knex<User>('users').insert({
        username: user.username,
        password: user.password
      }).then(result => result[0])

      const insertedUser = await this._knex<User>('users').where('id', insertedUserId).first()

      if (!insertedUser) {
        throw new Error('Error inserting account into database')
      }

      return insertedUser
    } catch (error) {
      if (error.errno === 19 && error.code === 'SQLITE_CONSTRAINT') throw new Error('A user with this username already exists.')
      throw error
    }
  }

  async update (user: UserProps): Promise<User> {
    await this._knex<User>('users').where('username', user.username).update({
      password: user.password
    })
    const updatedUser = await this._knex<User>('users').where('username', user.username).first()

    if (!updatedUser) {
      throw new Error('Error updating account password in database')
    }

    return updatedUser
  }

  async getByUsername (username: string): Promise<User> {
    const user = await this._knex<User>('users').where('username', username).first()
    if (!user) {
      throw new Error('Error fetching user')
    }
    return user
  }

  async getById (id: number): Promise<User> {
    const user = await this._knex<User>('users').where('id', id).first()
    if (!user) {
      throw new Error('Error fetching user')
    }
    return user
  }

  async getAll (): Promise<Array<User>> {
    return this._knex<User>('users')
  }
}
