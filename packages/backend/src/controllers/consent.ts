import { Config, Joi } from 'koa-joi-router'
import { AccountsAppContext } from '..'
import { hydraApi } from '../apis/hydra'

export async function show (ctx: AccountsAppContext): Promise<void> {
  const challenge = ctx.request.query['consent_challenge']
  ctx.logger.debug('Getting consent request', { challenge })

  const consentRequest = await hydraApi.getConsentRequest(challenge).catch(error => {
    ctx.logger.error(error, 'error in login request')
    throw error
  })
  ctx.logger.debug('Got hydra consent request', { consentRequest })

  if (consentRequest['skip'] || consentRequest['client'].client_id === 'frontend-service') {
    const acceptConsent = await hydraApi.acceptConsentRequest(challenge, {
      remember: true,
      remember_for: 0,
      grant_scope: consentRequest['requested_scope'],
      grant_access_token_audience: consentRequest['requested_access_token_audience'],
      session: {
        // // This data will be available when introspecting the token. Try to avoid sensitive information here,
        // // unless you limit who can introspect tokens.
        // access_token: accessTokenInfo,
        //
        // // This data will be available in the ID token.
        // id_token: idTokenInfo
      }
    }).catch(error => {
      ctx.logger.error('Error with hydra accepting consent', { error })
      throw error
    })

    ctx.body = {
      redirectTo: acceptConsent['redirect_to']
    }
    return
  }

  ctx.body = {
    requestedScopes: consentRequest['requested_scope'],
    client: consentRequest['client'], // TODO we should probably not leak all this data to the frontend
    user: consentRequest['subject']
  }
}

export async function store (ctx: AccountsAppContext): Promise<void> {
  const challenge = ctx.request.query['consent_challenge']
  const { accepts, scopes } = ctx.request.body
  ctx.logger.debug('Post consent request', { body: ctx.request.body, challenge })

  if (!accepts) {
    const rejectConsent = await hydraApi.rejectConsentRequest(challenge, {
      error: 'access_denied',
      error_description: 'The resource owner denied the request'
    }).catch(error => {
      ctx.logger.error('error rejecting hydra consent')
      throw error
    })

    ctx.body = {
      redirectTo: rejectConsent['redirect_to']
    }
    return
  }

  const consentRequest = await hydraApi.getConsentRequest(challenge)
  ctx.logger.debug('consent request from hydra', { consentRequest })

  const acceptConsent = await hydraApi.acceptConsentRequest(challenge, {
    remember: true,
    remember_for: 0,
    grant_scope: scopes,
    grant_access_token_audience: consentRequest['requested_access_token_audience'],
    session: {
      // This data will be available when introspecting the token. Try to avoid sensitive information here,
      // unless you limit who can introspect tokens.
      access_token: {

      },
      // This data will be available in the ID token.
      id_token: {

      }
    }
  }).catch(error => {
    ctx.logger.error('Error with hydra accepting consent', { error })
    throw error
  })

  ctx.body = {
    redirectTo: acceptConsent['redirect_to']
  }
}

export function getValidation (): Config {
  return {
    validate: {
      query: {
        consent_challenge: Joi.string().required().error(new Error('consent_challenge is required.'))
      }
    }
  }
}

export function storeValidation (): Config {
  return {
    validate: {
      type: 'json',
      body: {
        accepts: Joi.bool().required(),
        scopes: Joi.array().items(Joi.string()).required(),
        accountId: Joi.number().integer().greater(0).optional()
      },
      query: {
        consent_challenge: Joi.string().required().error(new Error('consent_challenge is required.'))
      }
    }
  }
}
