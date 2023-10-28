///ta bị bug vì implment interface của FectchAPI nhưng ta lại muốn sử dụng của express
///import các interface để định dạng kiểu cho para của middlewares
import { NextFunction, Request, RequestHandler, Response } from "express"
import User from "~/models/schemas/User.schema"
import databaseService from "~/services/database.services"
import usersService from "~/services/users.services"
//1 req của client gữi lên server sẽ có body(chứa các thứ cẫn gữi)

import { ParamsDictionary } from "express-serve-static-core"
import { RegisterReqBody } from "~/models/requests/User.requests"
import { error } from "console"

export const loginController = async (req: Request, res: Response) => {
  //lấy user_id từ user của request
  const { user }: any = req
  const user_id = user._id //thằng này ta lấy về từ mongo

  //dùng user_id tạo access_token và refresh_token
  const result = await usersService.login(user_id.toString())
  //login dùng để nhận user_id và trả về access_token và refresh_token

  //response access_token và refresh_token về cho client
  res.json({
    message: "login successfully",
    result
  })

  /*   const { email, password } = req.body
  if (email === "test@gmail.com" || password === "123456") {
    return res.json({
      message: "login successfully",
      result: [
        { fname: "Điệp", yob: 1999 },
        { fname: "Hùng", yob: 2003 },
        { fname: "Được", yob: 1994 }
      ]
    })
  } else {
    return res.status(400).json({
      error: "login failed"
    })
  } */
}

// export const registerController = async (
//   req: Request<ParamsDictionary, any, RegisterReqBody>,
//   res: Response,
//   next: NextFunction
// ) => {
//   //vì trong mô tả của một user đã có email và password, ta đã biết chắc chắn định dạng của email và password như thế nào
//   //ta sẽ check sương sương 2 thằng này

//   //* const { email, password } = req.body

//   //nếu chuẩn ta phải truyền nhiều thông tin vào
//   //email, password, name, ...
//   //!req.body bị any -> giải pháp: tạo ra 1 interface định nghĩa lại req.body là ntn

//   //!ta bọc lại bằng try-catch vì quá trình này hay phát sinh lỗi (rớt mạng)
//   try {
//     //ta demo throw lỗi cho hàm ansync với error handler
//     throw new Error("Tạo thử một cái lỗi nè")

//     //ta giả bộ với email và password này đã ngon và không cần middleware nữa
//     //insertOne: hàm của mongo, là một promise trả ra dữ liệu
//     // const result = await usersService.register({ email, password })
//     const result = await usersService.register(req.body)

//     res.json({
//       message: "register successfully",
//       result
//     })
//   } catch (err) {
//     // res.status(400).json({
//     //   message: "register failed",
//     //   err
//     // })

//     //demo lỗi với next
//     next(err)
//   }
// }

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  //vì trong mô tả của một user đã có email và password, ta đã biết chắc chắn định dạng của email và password như thế nào
  //ta sẽ check sương sương 2 thằng này

  //* const { email, password } = req.body

  //nếu chuẩn ta phải truyền nhiều thông tin vào
  //email, password, name, ...
  //!req.body bị any -> giải pháp: tạo ra 1 interface định nghĩa lại req.body là ntn

  //!ta bọc lại bằng try-catch vì quá trình này hay phát sinh lỗi (rớt mạng)

  // throw new Error("Tạo thử một cái lỗi nè")

  //ta giả bộ với email và password này đã ngon và không cần middleware nữa
  //insertOne: hàm của mongo, là một promise trả ra dữ liệu
  // const result = await usersService.register({ email, password })
  const result = await usersService.register(req.body)

  res.json({
    message: "register successfully",
    result
  })
}

//?Có một vấn đề với việc sử dụng try-catch quá nhiều như này trong quá trình phát triển ứng dụng
//ta sẽ tạo thêm 1 cái hàm chỉ để xử lí try-catch thôi
//không cần bọc try-catch trong middleware và controller (và những thằng async)
// function(func: RequestHandler) => {
//   return(req,res,next)=>{
//     try{

//     }catch(error){
//       next(error)
//     }
//   }
// }
