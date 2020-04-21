import {Guid, getRandomGuid} from "../../utils/Guid";
import {gotUserEventGuid} from "../../static/Constants";
import {
  Event,
  Subscriber,
  EventRecepient,
  EventSender
} from "../../utils/ServiceSubscriptionModel";
import {
  HttpQuery,
  HttpMethod,
  HttpConnection
} from "../../utils/HttpConnection";
import {apiEndpoints, apiUrl} from "../../static/Preferences";
import {JsonSchemaValidator} from "../../utils/JsonSchemaValidator";
import Cookies from 'js-cookie'



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

export class UserServiceEventRecipient
extends EventRecepient<User, UserServiceEvent> {
  constructor (callback: Subscriber<User, UserServiceEvent>) {
    super(userService, callback);
  }
}


/**
 * HttpClient request-response JSON protocols:
 */

interface UserRequest {
  session: string /// Guid string
}

interface UserResponseHaveGotUser {
  gotUser: true
  role: string /// "student"
  user: string /// Guid string
}

interface UserResponseHaveNotGotUser {
  gotUser: false
}

type UserResponse = UserResponseHaveGotUser | UserResponseHaveNotGotUser;

export class UserService extends EventSender<User, UserServiceEvent> {
  constructor () {
    super();
  }

  getUser (): void {
    const connection: HttpConnection<UserRequest, UserResponse> =
      new HttpConnection<UserRequest, UserResponse>(apiUrl);

    connection.setRequestValidator(
      new JsonSchemaValidator<UserRequest>(require("./requestSchema.json"))
    );

    connection.setResponseValidator(
      new JsonSchemaValidator<UserResponse>(require("./responseSchema.json"))
    );

    const session: string | undefined = Cookies.get('session');

    if (session === undefined) {
      /// TODO: send message about bad cookie:
      this.sendEvent(new UserServiceEvent(
        new UnauthorizedUser(),
        gotUserEventGuid
      ));
      return;
    }

    const request: HttpQuery<UserRequest> =  {
      headers: {},
      data: {
        session: session
      }
    };

    connection
      .send(apiEndpoints.user, HttpMethod.get, request)
      .then(
        (response: HttpQuery<UserResponse>): void => {
          let user: User = new UnauthorizedUser();

          if (response.data.gotUser === true) {
            switch (response.data.role) {
              case "student": {
                user = new StudentUser(new Guid(response.data.user));
                break;
              }
            }
          }

          this.sendEvent(new UserServiceEvent(user, gotUserEventGuid));
        },
        (error: Error): void => {
          this.sendEvent(
            new UserServiceEvent(
              new UnauthorizedUser(),
              gotUserEventGuid
            )
          );
          /// TODO: Show error here
        }
      ).catch(
        (error: Error): void => {
          this.sendEvent(
            new UserServiceEvent(
              new UnauthorizedUser(),
              gotUserEventGuid
            )
          );
          /// TODO: Show error here
        }
      );
  }
}


export const userService = new UserService();
