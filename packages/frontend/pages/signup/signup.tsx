import React from 'react'
import { NextPage } from "next"
import useForm from 'react-hook-form'
import Link from 'next/link'
import { UsersService } from '../../services/users'
import { checkUser } from '../../utils'


const Signup: NextPage = () => {
  const {register, handleSubmit, errors, setError} = useForm()

  const usersService = UsersService()

  const onSubmit = async (data: any) => {
    await usersService.signup(data.username, data.password).then((user) => {
      console.log(user)
      window.location.href = '/login'
    })
    // setError('password', "password", "Incorrect password")
  }

  return (
    <div className="w-full max-w-xs mx-auto md:mt-32">
      <div className="flex flex-col mb-6">
        <img className="mx-auto h-16" src={'/logo.png'}/>
        <div className="text-center text-gray-800 text-lg font-light">
          Create an Account!
        </div>
      </div>
      <form className="bg-white elevation-4 rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            name="username" ref={(register({required: true}))}
            autoComplete="username"
            id="username" type="text" placeholder="Username"/>
          <p className="ml-1 h-2 text-xs text-red-600">{errors.username ? errors.username.message : ""}</p>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            name="password" ref={(register({required: true}))}
            autoComplete="current-password"
            id="password" type="password" placeholder="******************"/>
          <p className="ml-1 h-2 text-xs text-red-600">{errors.password ? errors.password.message : ""}</p>
        </div>
        <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="submit">
          Signup
        </button>
      </form>
      <div className="text-center mt-2 text-gray-600 text-light text-sm">
        Have an account already?
      </div>
      <a href="/login">
        <button
          className="elevation-2 border-2 border-gray-500 text-gray-600 hover:bg-gray-500 hover:text-white w-full font-bold py-2 px-4 my-4 rounded"
          type="button">
          Login
        </button>
      </a>
      {/* <p className="text-center text-gray-500 text-xs">©2019 Rafiki Money. All rights reserved.</p> */}
    </div>
  )
}

Signup.getInitialProps = async ({}) => {
  return {}
}

export default Signup
