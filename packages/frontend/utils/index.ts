import { parseCookies } from 'nookies'
import { UsersService } from '../services/users'

const usersService = UsersService()

export const formatCurrency = (value: number, scale: number) => {
  return (value * 10 ** (-scale)).toFixed(scale) + ' XML'
}

export const checkUser = async (ctx) => {
  let user, cookies
  try {
    cookies = parseCookies(ctx)
    if (cookies && cookies.token) {
      user = await usersService.getUser(cookies.token)
    } else {
      throw new Error('no token')
    }
  } catch (error) {
    console.log(error)
    if (typeof window === 'undefined') {
      ctx.res.writeHead(302, {
        Location: '/signup'
      })
      ctx.res.end()
      return
    }

    window.location.href = '/signup'
  }
  return { ...user, token: cookies.token }
}
