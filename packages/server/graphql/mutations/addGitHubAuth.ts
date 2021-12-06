import {GraphQLID, GraphQLNonNull} from 'graphql'
import upsertGitHubAuth from '../../postgres/queries/upsertGitHubAuth'
import {GetProfileQuery} from '../../types/githubTypes'
import {getUserId, isTeamMember} from '../../utils/authorization'
import getGitHubRequest from '../../utils/getGitHubRequest'
import getProfile from '../../utils/githubQueries/getProfile.graphql'
import GitHubServerManager from '../../utils/GitHubServerManager'
import segmentIo from '../../utils/segmentIo'
import standardError from '../../utils/standardError'
import {GQLContext, GQLResolveInfo} from '../graphql'
import AddGitHubAuthPayload from '../types/AddGitHubAuthPayload'

export default {
  name: 'AddGitHubAuth',
  type: new GraphQLNonNull(AddGitHubAuthPayload),
  args: {
    code: {
      type: new GraphQLNonNull(GraphQLID)
    },
    teamId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  resolve: async (
    _source: unknown,
    {code, teamId}: {code: string; teamId: string},
    context: GQLContext,
    info: GQLResolveInfo
  ) => {
    const {authToken} = context
    const viewerId = getUserId(authToken)

    // AUTH
    if (!isTeamMember(authToken, teamId)) {
      return standardError(new Error('Attempted teamId spoof'), {userId: viewerId})
    }

    // RESOLUTION
    const {accessToken, scope} = await GitHubServerManager.init(code)
    const githubRequest = getGitHubRequest(info, context, {
      accessToken
    })
    const [data, error] = await githubRequest<GetProfileQuery>(getProfile)

    if (error) {
      return standardError(error, {userId: viewerId})
    }
    const {viewer} = data
    const {login} = viewer

    await upsertGitHubAuth({accessToken, login, teamId, userId: viewerId, scope})
    segmentIo.track({
      userId: viewerId,
      event: 'Added Integration',
      properties: {
        teamId,
        service: 'GitHub'
      }
    })
    return {teamId, userId: viewerId}
  }
}
