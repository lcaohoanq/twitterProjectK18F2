import { Router } from "express";
import { serveImageController, serveVideoStreamController } from "~/controllers/medias.controller";

const staticRouter = Router();
staticRouter.get("/image/:namefile", serveImageController); //chưa code
//vậy route sẽ là localhost:4000/static/image/:namefile

//từ
// staticRouter.get('/video/:namefile', serveVideoController)
//thành
staticRouter.get("/video-stream/:namefile", serveVideoStreamController);

export default staticRouter;
