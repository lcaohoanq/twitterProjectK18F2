import jwt from "jsonwebtoken"
import { TokenPayload } from "~/models/requests/User.requests"

//làm hàm nhận vào payload, privateKey, options từ đó ký tên
//jwt.sign(payload, secretOrPrivateKey, [options, callback])

//?tại sao jwt nhận vào tổng 4 tham số nhưng gộp lại thành 3?
//phát sinh lỗi khi ký tên
//nên ta muốn dành callback để xử lí lỗi, ném ra lỗi trong quá trình ký tên

//trong quá trình ký tên phải đợi
//server chỉ trả ra resolve

//nhưng thằng này nếu thất bại thì sẽ trả reject
//thành công resolve
export const signToken = ({
  payload,
  privateKey = process.env.JWT_SECRET as string,
  options = { algorithm: "HS256" }
}: {
  payload: string | object | Buffer
  privateKey?: string
  options: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) throw reject(err)
      resolve(token as string)
    })
  })
}

//ta có 2 cách để định nghĩa
//khắc phục việc truyền 3 dữ liệu này thành một object

//payload có thể là bất cứ thứ gì

//privateKey ta chủ động tạo 1 key lưu ở .env
//mục đích: nếu sử dụng mà không đề cập, thì ta sẽ tự động đưa key bên env

//config thêm options là algorithm H256

//vậy ta đã có một hàm đưa tao nội dung, và hàm này sẽ kí tên khi ta đưa nội dung (payload vào)

//TODO: Tiếp tục build thêm hàm kí access token và refresh token (ở users.service)
//(thêm cho chúng token-type nhưng nếu để thông tin như vậy sẽ không hay, ta dùng enum config mỗi thông tin ứng với mỗi số)

//lưu exp date vào env

//TODO: 2.Verify Token có phải do mình tạo ra hay không
export const verifyToken = ({
  token,
  secretOrPublicKey = process.env.JWT_SECRET as string
}: {
  token: string
  secretOrPublicKey?: string
}) => {
  //trả về JwtPayload(thông tin người gữi req) nếu token hợp lệ
  return new Promise<TokenPayload>((resolve, reject) => {
    //method này sẽ verify token, nếu token hợp lệ thì nó sẽ trả về payload
    //nếu token không hợp lệ thì nó sẽ throw error
    //secretOrPublicKey dùng để verify token
    //nếu token được tạo ra bằng secret|PublicKey thì ta dùng secret|PublicKey key để verify
    //từ đó biết rằng access_token được tạo bởi chính server
    jwt.verify(token, secretOrPublicKey, (error, decoded) => {
      if (error) throw reject(error)
      resolve(decoded as TokenPayload)
    })
  })
}
