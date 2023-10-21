///ta bị bug vì implment interface của FectchAPI nhưng ta lại muốn sử dụng của express
///import các interface để định dạng kiểu cho para của middlewares
import { Request, Response } from "express"
import User from "~/models/schemas/User.schema"
import databaseService from "~/services/database.services"
import usersService from "~/services/users.services"
//1 req của client gữi lên server sẽ có body(chứa các thứ cẫn gữi)

import { ParamsDictionary } from "express-serve-static-core"
import { RegisterReqBody } from "~/models/requests/User.requests"

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
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
  }
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  //vì trong mô tả của một user đã có email và password, ta đã biết chắc chắn định dạng của email và password như thế nào
  //ta sẽ check sương sương 2 thằng này

  //* const { email, password } = req.body

  //nếu chuẩn ta phải truyền nhiều thông tin vào
  //email, password, name, ...
  //!req.body bị any -> giải pháp: tạo ra 1 interface định nghĩa lại req.body là ntn

  //!ta bọc lại bằng try-catch vì quá trình này hay phát sinh lỗi (rớt mạng)
  try {
    //ta giả bộ với email và password này đã ngon và không cần middleware nữa
    //insertOne: hàm của mongo, là một promise trả ra dữ liệu
    // const result = await usersService.register({ email, password })
    const result = await usersService.register(req.body)

    res.json({
      message: "register successfully",
      result
    })
  } catch (err) {
    res.status(400).json({
      message: "register failed",
      err
    })
  }
}
