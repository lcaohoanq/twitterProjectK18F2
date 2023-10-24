import { Request, Response, NextFunction } from "express"
import { body, validationResult, ValidationChain } from "express-validator"

//import chay
import { RunnableValidationChains } from "express-validator/src/middlewares/schema"
import { EntityError, ErrorWithStatus } from "~/models/Errors"

// can be reused by many routes

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  //!khi mà ai đó gọi validate này sẽ nhận được một middlewares
  //! ta bỏ checkSchema vào validate
  //middleware này sẽ lưu lỗi vào request
  return async (req: Request, res: Response, next: NextFunction) => {
    //đi qua từng cái check lỗi
    //và lưu đến req, lấy ra bằng cách validationResult
    await validation.run(req)
    //hàm run trả ra một Promise

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
      //không có lỗi thì sẽ đi tiếp đến controller
    }

    const errorObject = errors.mapped()
    const entityError = new EntityError({ errors: {} }) //entityError dùng để thay thế errorObject

    //xử lí errorObject
    for (const key in errorObject) {
      //lấy msg của từng lỗi ra
      const { msg } = errorObject[key]
      //nếu msg có dạng ErrorWithStatus và status !== 422 thì ném cho default error handler
      if (msg instanceof ErrorWithStatus && msg.status !== 422) {
        return next(msg)
      }

      //!ta lưu các lỗi 422 từ errorObject qua entityError
      //mỗi lần đi qua cái key của errorObject, ta sao chép key, kèm message
      entityError.errors[key] = msg
    }

    //lỗi với map khác gì mapped :)
    // res.status(400).json({ errors: errors.mapped() })

    //ta đổi 400 thành lỗi 422m ở đây xử lí lỗi luôn chứ không ném về ErrorHandler tổng
    // res.status(422).json({ errors: errorObject })
    next(entityError)
  }
}
