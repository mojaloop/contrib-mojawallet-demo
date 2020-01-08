import React from 'react'
import { NextPage } from "next"
import Button from '../components/button'
import { checkUser } from '../utils'
import { ProfilePageProps } from '../types'

const Signup: NextPage<ProfilePageProps> = ({user}) => {
  return (
    <div className="flex flex-wrap content-center items-center justify-center text-center w-full h-screen">
      <img className="h-32" src={'/Logo.svg'}/>
      <div className="w-full mt-5 text-gray-800 text-headline">{user.username}</div>
      <div className="w-full mt-20">
        <Button to="/logout" text={false}>logout</Button>
      </div>
    </div>
  )
}

export default Signup

Signup.getInitialProps = async (ctx) => {
  const user = await checkUser(ctx)
  return { user }
}
