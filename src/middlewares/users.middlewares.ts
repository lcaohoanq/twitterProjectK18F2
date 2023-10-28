//giả sử đang muốn làm một route '/login'
//thì người dùng sẽ truyền email và password
//tạo 1 cái request có body là email và password
//TODO: làm 1 middleware kiểm tra xem email và password có được truyền lên hay không

//!nếu ta truyền như này Typescript sẽ báo lỗi any
// const loginValidator = (req, res, next) => {
//   const { email, password } = req.body
//   if (!email || !password) {
//     //status 400 là lỗi validator (quy ước)
//     return res.status(400).json({
//       error: 'Missing email or password'
//     })
//   }
//   next()
// }

///import các interface để định dạng kiểu cho para của middlewares
import { Request, Response, NextFunction } from "express"
import { checkSchema } from "express-validator"
import { JsonWebTokenError } from "jsonwebtoken"
import { capitalize } from "lodash"
import HTTP_STATUS from "~/constants/httpStatus"
import { USERS_MESSAGES } from "~/constants/messages"
import { ErrorWithStatus } from "~/models/Errors"
import databaseService from "~/services/database.services"
import usersService from "~/services/users.services"
import { hashPassword } from "~/utils/crypto"
import { verifyToken } from "~/utils/jwt"
import { validate } from "~/utils/validation"

//*Request, Response, NextFunction là 3 interface, được express cung cấp, nhằm bổ nghĩa cho các param

//1 req của client gửi lên server sẽ có body(chứa các thứ cẫn gửi)
// export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
//   // ta vào body lấy email, password ra
//   console.log(req.body) //log xem có gì
//   const { email, password } = req.body
//   if (!email || !password) {
//     return res.status(400).json({
//       error: "Missing email or password"
//     })
//   }
//   next()
// }

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            //dựa vào email và password tìm đối tượng users tương ứng
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password) //nếu ta hash cái password, ta mã hoá và so khớp với dữ liệu trên db xem có trùng không
            })
            if (user == null) {
              throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT) //ném một lỗi mặc định 422
            }
            req.user = user //ta gửi thằng user này lên cái đường truyền tiếp theo, xử lí tiếp, đã ngon rồi
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 8,
            max: 50
          },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      }
    },
    ["body"] //thông báo cho nó chỉ check phần body
  )
)

export const registerValidator = validate(
  checkSchema(
    {
      //ta check dữ liệu trong db, dù có truyền vào name nhưng nó bị rỗng
      //vì trong RegisterController của users.controller ta chỉ truyền vào 2 tham số là email và password
      //và khi tới route register, ta chạy đến users.service để đăng kí với email và password, theo Userchema
      //nó tự động tạo ra date_of_birth nhưng là do mình setup, không phải dữ liệu mình truyền lên

      //nếu đúng thì ta sẽ qua controller và phân rã tất cả các thuộc tính
      //nhưng req.body bị any nên có thể truyền bất cứ thứ gì vào
      name: {
        notEmpty: {
          //!convert from true
          errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
        },
        isString: {
          //!convert from true
          errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 100
          },
          errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
        }
      },
      //!kiểm tra xem nếu email đã có tồn tại rồi, không up lên nữa
      //1. nằm ở database
      //2. nằm ở service, tầng user
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          //value đại diện cho email
          options: async (value, { req }) => {
            const isExist = await usersService.checkEmailExist(value)
            if (isExist) {
              //lỗi này sẽ không phải trực tiếp được Error Handler xử lí
              //mà nó được checkSchema hứng lại (ném ngược lên validate)
              //validate được gọi ở hàm validate trong validation.ts
              //hứng vào request -> validationResult

              throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS)

              //!nếu ta throw new ErrorWithStatus
              //thì bên validation.ts sẽ hứng lại và kiểm tra xem lỗi có tạo từ ... không
              //nếu có thì quăng thẳng ra cho Errorhandler

              // throw new ErrorWithStatus({
              //   message: "Email already exist",
              //   status: 401
              // })
            }
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 8,
            max: 50
          },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
            // returnScore: true,
            //nếu để true sẽ chấm điểm thành số
            //false để hiển thị mạnh: true, yếu: false
          },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      },
      //! xét trùng với password
      confirm_password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 8,
            max: 50
          },
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
            // returnScore: true,
            //nếu để true sẽ chấm điểm thành số
            //false để hiển thị mạnh: true, yếu: false
          },
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
        },
        //nếu muốn viết thêm hàm để kiểm tra
        custom: {
          options: (value, { req }) => {
            //value đại diện cho confirm_password vì nó nằm ở confirm_password
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
            }
            return true
          }
        }
      },
      date_of_birth: {
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          }
        },
        errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_BE_ISO8601
      }
    },
    ["body"]
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        notEmpty: {
          errorMessage: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            const access_token = value.split(" ")[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            //nếu xuống được đây thì tức là access_token có rồi
            //ta sẽ verify access_token và lấy payload() ra lưu lại trong req
            try {
              const decode_authorization = await verifyToken({ token: access_token })
              req.decode_authorization = decode_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ["headers"]
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        notEmpty: {
          errorMessage: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            try {
              const decoded_refresh_token = await verifyToken({ token: value })
              const refresh_token = await databaseService.refreshTokens.findOne({
                token: value
              })
              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              req.decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize((error as JsonWebTokenError).message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
            return true
          }
        }
      }
    },
    ["body"]
  )
)
