import { Router } from "express";
import * as userController from "./userController.js";
import { loginValidator } from "./userValidations.js";
import { validation } from "../../middelwares/validation.js";

const router = Router();

router.post('/add-hardcoded-users', userController.hardcodedUsers);
router.post('/login', validation({ body: loginValidator }), userController.login);







export default router;