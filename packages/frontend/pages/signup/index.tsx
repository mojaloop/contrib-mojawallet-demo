import React from 'react'
import { NextPage } from "next"
import Button from '../../components/button'
import { checkUserOnSignup } from '../../utils'
import { ProfilePageProps } from '../../types'

const Signup: NextPage<ProfilePageProps> = ({user}) => {
  return (
    <div className="flex flex-wrap content-center items-center justify-center text-center w-full h-screen">
      <img className="h-32" src={'/Logo.svg'}/>
      <div className="w-full text-gray-800 text-headline">Welcome to<br/>Mojaloop</div>
      <div className="w-full text-gray-500 text-caption mt-2">Your new personal<br/>mobile wallet</div>
      <div className="w-full mt-20">
        <Button to="/signup/name" text={false}>Get started</Button>
      </div>
      <div className="w-full mt-2">
        <Button to="/login" text={true}>login</Button>
      </div>
    </div>
  )
}

export default Signup

Signup.getInitialProps = async (ctx) => {
  const user = await checkUserOnSignup(ctx)
  return { user }
}
