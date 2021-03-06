import {Guid, getRandomGuid} from "../../utils/Guid";
import {gotUserEventGuid} from "../../static/Constants";
import {
  Event,
  EventSender
} from "../../utils/ServiceSubscriptionModel";
import {
  HttpQuery,
  HttpMethod,
  HttpConnection
} from "../../utils/HttpConnection";
import * as preferences from "../../static/Preferences";
import {JsonSchemaValidator} from "../../utils/JsonSchemaValidator";
import {storageService} from "../storage";



/**
 * User inheritance model implementation:
 */

export abstract class User {}

export class UnauthorizedUser extends User {}

export abstract class AuthorizedUser extends User {
  declare private readonly guid: Guid;

  constructor (guid: Guid) {
    super();
    this.guid = guid;
  }
}

export class StudentUser extends AuthorizedUser {
  constructor (guid: Guid) {
    super(guid);
  }
}


/**
 * Service subscription model implementation:
 */

export class UserServiceEvent extends Event<User> {
  constructor (user: User, guid: Guid) {
    super(user, guid);
  }
};


/**
 * HttpClient request-response JSON protocols:
 */

interface UserRequest {
  session: string /// Guid string
  poll: string /// Guid string
}

interface UserResponseHaveGotUser {
  gotUser: true
  role: string /// "student"
  userGuid: string /// Guid string
}

interface UserResponseHaveNotGotUser {
  gotUser: false
}

type UserResponse = UserResponseHaveGotUser | UserResponseHaveNotGotUser;

class UserService extends EventSender<User, UserServiceEvent> {
  constructor () {
    super();
  }

  getUser (): void {
    const connection: HttpConnection<UserRequest, UserResponse> =
      new HttpConnection<UserRequest, UserResponse>(preferences.apiUrl);

    connection.setRequestValidator(
      new JsonSchemaValidator<UserRequest>(require("./requestSchema.json"))
    );

    connection.setResponseValidator(
      new JsonSchemaValidator<UserResponse>(require("./responseSchema.json"))
    );

    const poll: Guid | null = storageService.getPoll();
    let session: Guid | null;

    if (
      !storageService.sessionExists() ||
      poll === null ||
      (session = storageService.getSession()) === null
    ) {
      this.sendEvent(new UserServiceEvent(
        new UnauthorizedUser(),
        gotUserEventGuid
      ));
      return;
    }

    const request: HttpQuery<UserRequest> =  {
      headers: {},
      data: {
        session: session.guid,
        poll: poll.guid
      }
    };

    connection
      .send(preferences.apiEndpoints.user, HttpMethod.post, request)
      .then(
        (response: HttpQuery<UserResponse>): void => {
          let user: User = new UnauthorizedUser();

          if (response.data.gotUser === true) {
            switch (response.data.role) {
              case "student": {
                user = new StudentUser(new Guid(response.data.userGuid));
                break;
              }
            }
          }

          this.sendEvent(new UserServiceEvent(user, gotUserEventGuid));
        },
        (error: Error): void => {
          throw(error);
        }
      ).catch(
        (error: Error): void => {
          this.sendEvent(
            new UserServiceEvent(
              new UnauthorizedUser(),
              gotUserEventGuid
            )
          );
        }
      );
  }
}


export const userService = new UserService();
