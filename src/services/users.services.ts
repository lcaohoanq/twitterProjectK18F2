import User from "~/models/schemas/User.schema";
import databaseService from "./database.services";
import { RegisterReqBody, UpdateMeReqBody } from "~/models/requests/User.requests";
import { hashPassword } from "~/utils/crypto";
import { signToken } from "~/utils/jwt";
import { TokenType, UserVerifyStatus } from "~/constants/enums";
import RefreshToken from "~/models/schemas/RefreshToken.schema";
import { ObjectId } from "mongodb";
import { USERS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/Errors";
import HTTP_STATUS from "~/constants/httpStatus";
import { Follower } from "~/models/schemas/Followers.schema";
import axios, { isCancel, AxiosError } from "axios";
class UsersService {
  //TODO: Hàm nhận vào user_id (định danh mình là ai) và bỏ vào payload để tạo access_token
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify: verify },
      //không cần bỏ secretKey vì ta đã để optional
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN },
      //vì đã update trong env các jwt secret mới, và ta đã customize trong jwt nên cần phải thay đổi
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    });
  }

  //TODO: Hàm nhận vào user_id (định danh mình là ai) và bỏ vào payload để tạo refresh_token
  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken, verify: verify },
      //không cần bỏ secretKey vì ta đã để optional
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN },
      //vì đã update trong env các jwt secret mới, và ta đã customize trong jwt nên cần phải thay đổi
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    });
  }

  //TODO: hàm kí access và resfresh token
  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })]);
  }
  //?Xài 2 hàm trên ở đâu? Khi mà ta đăng kí thì ta sẽ tạo 2 mã này đưa cho người dùng, khi người dùng làm gì, gửi ngược lại mình cái mã này là mình sẽ biết đó là ai

  //!thêm 1 hàm emailVerifyToken (có tác dụng để gửi email cho người dùng, người dùng mở ra và gửi lại ta cái mã thì verify trong db = 0 -> 1)
  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken, verify: verify },
      //không cần bỏ secretKey vì ta đã để optional
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN },
      //vì đã update trong env các jwt secret mới, và ta đã customize trong jwt nên cần phải thay đổi
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
    });
  }

  //TODO: tạo hàm signForgotPasswordToken
  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPassWordToken, verify: verify },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string //thêm
    });
  }

  async checkEmailExist(email: string) {
    const users = await databaseService.users.findOne({ email: email });

    //users này trả về một cái User | null
    //ta ép kiểu về boolean true|false
    return Boolean(users);
  }

  //*demo với email và password

  // async register(payload: { email: string; password: string }) {
  //   const { email, password } = payload
  //   const result = await databaseService.users.insertOne(
  //     new User({
  //       email, //tạo user chỉ cần email, password
  //       password
  //     })
  //   )
  //   return result
  // }

  //!ta định nghĩa lại RegisterReqBody = payload

  async register(payload: RegisterReqBody) {
    //ta tự tạo 1 user_id mà không cần nhờ đến mongo nữa
    const user_id = new ObjectId();
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    });

    //trong result này có gì?
    //"acknowledge"
    //?"insertId" : "6533999f3ef6c1c7d752a435"
    //mình sẽ lấy cái mã này đóng gói lại -> token -> đưa người dùng
    //người dùng sẽ cầm token này đưa cho mình, khi yêu cầu sử dụng dịch vụ nào đó
    const result = await databaseService.users.insertOne(
      //!
      new User({
        //ta cần phải tạo 1 User với tất cả những thông tin có trong RegisterReqBody

        //phân rã ra
        ...payload,
        //ta bị báo lỗi, tại vì trong RRB của mình có date_of_birth
        //trong payload cũng có date_of_birth
        //?vậy biết lấy thằng nào

        _id: user_id,

        //!thêm prop này để fill username
        ///tại sao cần fill vào? vì khi register một user mới, username nó bị rỗng
        username: `user${user_id.toString()}`,

        email_verify_token,

        //!xử lí bằng cách override lại
        date_of_birth: new Date(payload.date_of_birth),
        //payload.date_of_birth là một string được ép kiểu về date
        password: hashPassword(payload.password)
      })
    );

    //*ta hứng vào user_id để đổ lên db
    // const user_id = result.insertedId.toString() //đây là hành động mà ta lấy của mongoDB

    //!ta kí theo cách thông thường, synchronus, nhưng nó không hợp lí
    // const access_token = await this.signAccessToken(user_id)
    // const refresh_token = await this.signRefreshToken(user_id)

    // *ta chủ đích sử dụng kí bất đồng bộ
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    });
    //phân rã mảng ta xài ngoặc vuông

    //!ta không trả ra result cho người dùng nữa
    // return result

    //!lưu refreshtoken sau khi lưu user vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    );
    //giả lập gửi mail bằng console.log
    //thông tin này ta sẽ gửi vào mail của người đăng kí, và người đăng kí sẽ đưa lại mình
    console.log("email_verify_token\n", email_verify_token);
    //!khi mình đăng kí một user thành công thì terminal sẽ trả cho mình cái emailverifytoken vào trong terminal

    //* ta trả ra cho client at và rt
    return { access_token, refresh_token };
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    //dùng user_id để tạo access và refresh token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify
    });

    //!lưu refreshtoken vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    );

    return { access_token, refresh_token };
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token });
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    };
  }

  async verifyEmail(user_id: string) {
    //cập nhật lại user
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            verify: UserVerifyStatus.Verified,
            email_verify_token: "",
            updated_at: "$$NOW"
          }
        }
      ]
    );
    //nếu verify xong thì ta sẽ gửi lại at, rt cho người dùng
    //để cung cấp dịch vụ cho họ ngay
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify: UserVerifyStatus.Verified
    });
    //lưu at và rt vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    );
    return { access_token, refresh_token };
  }

  async resendEmailVerify(user_id: string) {
    //tạo ra email_verify_token mới
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified
    });
    //chưa làm chức năng gửi email, nên giả bộ ta đã gửi email cho client rồi, hiển thị bằng console.log
    console.log("resend verify email token\n", email_verify_token);
    //vào database và cập nhật lại email_verify_token mới trong table user
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: { email_verify_token: email_verify_token, updated_at: "$$NOW" }
      }
    ]);
    //trả về message
    // console.log(email_verify_token)

    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    };
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    //tạo ra forgot_password_token
    const forgot_password_token = await this.signForgotPasswordToken({
      user_id,
      //khi mà mình quên mật khẩu thì tài khoản verify hoặc không thì ta vẫn không biết được,
      //ta sẽ nhận thông tin verify từ bên ngoài
      verify
    });

    //gửi email cho người dùng đường link có cấu trúc như này
    //http://appblabla/forgot-password?token=xxxx
    //xxxx trong đó xxxx là forgot_password_token
    //sau này ta sẽ dùng aws để làm chức năng gửi email, giờ ta k có
    //ta log ra để test
    // console.log("forgot_password_token\n", forgot_password_token)

    //cập nhật lại user vào forgot_password_token và user_id
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: { forgot_password_token: forgot_password_token, updated_at: "$$NOW" }
      }
    ]);

    console.log("forgot_password_token\n", forgot_password_token);
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    };
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    //TODO: tìm user thông qua user_id và cập nhật lại password và forgot_password_token
    //tất nhiên là lưu password đã hash rồi
    //ta không cần phải kiểm tra user có tồn tại không, vì forgotPasswordValidator đã làm rồi
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: "", //*không thể dùng token để đổi mk 2 lần
          updated_at: "$$NOW"
        }
      }
    ]);
    //nếu bạn muốn ngta đổi mk xong tự động đăng nhập luôn thì trả về access_token và refresh_token
    //ở đây mình chỉ cho ngta đổi mk thôi, nên trả về message
    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    };
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        //ta custom dữ liệu trả về bằng projection
        //có 1, không có : 0
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
        //dữ liệu trong postman đã bị ẩn đi 3 thuộc tính trên
      }
    );
    return user;
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    //hỏi người dùng trong payload có dob không?
    //nếu có thì truyền vô trong một cái payload mới là _payload
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload;

    //cập nhật _payload lên db
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      [
        {
          $set: {
            ..._payload,
            updated_at: "$$NOW" //!vì sử dụng updateNow nên dùng ngoặc vuông
          }
        }
      ],
      {
        returnDocument: "after", //trả về document sau khi update, nếu k thì nó trả về document cũ
        projection: {
          //chặn các property k cần thiết
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    );
    return user; //đây là document sau khi update
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username: username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          create_at: 0,
          update_at: 0
        }
      }
    );
    if (user == null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }
    return user;
  }

  async follow(user_id: string, followed_user_id: string) {
    //kiểm tra xem đã follow hay chưa
    const isFollowed = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });
    //nếu đã follow thì return message là đã follow
    if (isFollowed != null) {
      return {
        message: USERS_MESSAGES.FOLLOWED
      };
    }
    //chưa thì thêm 1 document vào collection followers
    await databaseService.followers.insertOne(
      new Follower({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })
    );
    return {
      message: USERS_MESSAGES.FOLLOW_SUCCESS
    };
  }

  async unfollow(user_id: string, followed_user_id: string) {
    //kiểm tra xem đã follow hay chưa
    const isFollowed = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });

    //nếu chưa follow thì return message là "đã unfollow trước đó" luôn
    if (isFollowed == null) {
      return {
        message: USERS_MESSAGES.ALREADY_UNFOLLOWED
      };
    }

    //nếu đang follow thì tìm và xóa document đó
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });

    //nếu xóa thành công thì return message là unfollow success
    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESS
    };
  }

  async changePassword(user_id: string, password: string) {
    //tìm user thông qua user_id
    //cập nhật lại password và forgot_password_token
    //tất nhiên là lưu password đã hash rồi
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: "",
          updated_at: "$$NOW"
        }
      }
    ]);
    //nếu bạn muốn ngta đổi mk xong tự động đăng nhập luôn thì trả về access_token và refresh_token
    //ở đây mình chỉ cho ngta đổi mk thôi, nên trả về message
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS // trong message.ts thêm CHANGE_PASSWORD_SUCCESS: 'Change password success'
    };
  }

  async refreshToken(user_id: string, verify: UserVerifyStatus, refresh_token: string) {
    //tạo mới
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({
        user_id: user_id,
        verify
      }),
      this.signRefreshToken({
        user_id: user_id,
        verify
      })
    ]);
    //vì một người đăng nhập ở nhiều nơi khác nhau, nên họ sẽ có rất nhiều document trong collection refreshTokens
    //ta không thể dùng user_id để tìm document cần update, mà phải dùng token, đọc trong RefreshToken.schema.ts
    await databaseService.refreshTokens.deleteOne({ token: refresh_token }); //xóa refresh
    //insert lại document mới
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: new_refresh_token })
    );
    return { access_token: new_access_token, refresh_token: new_refresh_token };
  }

  //getOAuthGoogleToken dùng code nhận đc để yêu cầu google tạo id_token
  private async getOAuthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID, //khai báo trong .env bằng giá trị trong file json
      client_secret: process.env.GOOGLE_CLIENT_SECRET, //khai báo trong .env bằng giá trị trong file json
      redirect_uri: process.env.GOOGLE_REDIRECT_URI, //khai báo trong .env bằng giá trị trong file json
      grant_type: "authorization_code"
    };
    //giờ ta gọi api của google, truyền body này lên để lấy id_token
    //ta dùng axios để gọi api `npm i axios`
    const { data } = await axios.post(`https://oauth2.googleapis.com/token`, body, {
      headers: {
        "Content-Type": "application/json" //kiểu truyền lên là form
      }
    }); //nhận đc response nhưng đã rã ra lấy data
    return data as {
      access_token: string;
      id_token: string;
    };
  }

  //dùng id_token để lấy thông tin của người dùng
  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo`, {
      params: {
        access_token,
        alt: "json"
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    });
    //ta chỉ lấy những thông tin cần thiết
    return data as {
      id: string;
      email: string;
      email_verified: boolean;
      name: string;
      given_name: string;
      family_name: string;
      picture: string;
      locale: string;
    };
  }

  //xài ở oAuth
  async oAuth(code: string) {
    //dùng code lấy bộ token từ google
    const { access_token, id_token } = await this.getOAuthGoogleToken(code);
    const userInfor = await this.getGoogleUserInfo(access_token, id_token);
    //userInfor giống payload mà ta đã check jwt ở trên
    if (!userInfor.email_verified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GMAIL_NOT_VERIFIED, // trong message.ts thêm GMAIL_NOT_VERIFIED: 'Gmail not verified'
        status: HTTP_STATUS.BAD_REQUEST //thêm trong HTTP_STATUS BAD_REQUEST:400
      });
    }
    //kiểm tra email đã đăng ký lần nào chưa bằng checkEmailExist đã viết ở trên
    const user = await databaseService.users.findOne({ email: userInfor.email });
    //nếu tồn tại thì cho login vào, tạo access và refresh token
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      }); //thêm user_id và verify
      //thêm refresh token vào database
      await databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: user._id, token: refresh_token }));
      return {
        access_token,
        refresh_token,
        new_user: 0, //đây là user cũ
        verify: user.verify
      };
    } else {
      //!ta không tìm được một user nào được giải mã ngược từ id_token
      //random string password
      const password = Math.random().toString(36).slice(1, 15);
      //chưa tồn tại thì cho tạo mới, hàm register(đã viết trước đó) trả về access và refresh token
      const data = await this.register({
        email: userInfor.email,
        name: userInfor.name,
        password: password,
        confirm_password: password,
        date_of_birth: new Date().toISOString()
      });
      return {
        ...data,
        new_user: 1, //đây là user mới
        verify: UserVerifyStatus.Unverified
      };
    }
  }
}

const usersService = new UsersService();
export default usersService;
