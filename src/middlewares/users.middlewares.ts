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
import usersService from "~/services/users.services"
import { validate } from "~/utils/validation"

//*Request, Response, NextFunction là 3 interface, được express cung cấp, nhằm bổ nghĩa cho các param

//1 req của client gửi lên server sẽ có body(chứa các thứ cẫn gửi)
export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  // ta vào body lấy email, password ra
  console.log(req.body) //log xem có gì
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({
      error: "Missing email or password"
    })
  }
  next()
}

export const registerValidator = validate(
  checkSchema({
    //ta check dữ liệu trong db, dù có truyền vào name nhưng nó bị rỗng
    //vì trong RegisterController của users.controller ta chỉ truyền vào 2 tham số là email và password
    //và khi tới route register, ta chạy đến users.service để đăng kí với email và password, theo Userchema
    //nó tự động tạo ra date_of_birth nhưng là do mình setup, không phải dữ liệu mình truyền lên

    //nếu đúng thì ta sẽ qua controller và phân rã tất cả các thuộc tính
    //nhưng req.body bị any nên có thể truyền bất cứ thứ gì vào
    name: {
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        }
      }
    },
    //!kiểm tra xem nếu email đã có tồn tại rồi, không up lên nữa
    //1. nằm ở database
    //2. nằm ở service, tầng user
    email: {
      notEmpty: true,
      isEmail: true,
      trim: true,
      custom: {
        //value đại diện cho email
        options: async (value, { req }) => {
          const isExist = await usersService.checkEmailExist(value)
          if (isExist) {
            throw new Error("Email already exists")
          }
          return true
        }
      }
    },
    password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
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
        }
      },
      errorMessage:
        "Password must be at least 8 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol"
    },
    //! xét trùng với password
    confirm_password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
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
        }
      },
      errorMessage:
        "Confirm Password must be at least 8 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol",
      //nếu muốn viết thêm hàm để kiểm tra
      custom: {
        options: (value, { req }) => {
          //value đại diện cho confirm_password vì nó nằm ở confirm_password
          if (value !== req.body.password) {
            throw new Error("confirm_password does not match password")
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
      }
    }
  })
)
