const express = require("express");
const security = require("../utils/security");
const fs = require('fs');
const mailer = require("../../modules/mailer");
const authMiddleware = require('../middlewares/auth')
const jwt = require('jsonwebtoken')
const authConfig = require('../../config/auth.json')

const User = require("../models/user");
const { upload } = require('../utils/upload')
const router = express.Router();

//router.use(authMiddleware)

router.post("/update", authMiddleware, async (req, res) => {
    try {
        console.log("Chegou aqui")
        let { _id, name, email, image } = req.body;
        const user = await User.findById({ _id });
        if (!user) {
            return res.status(400).send({ error: "Atualização do usuário falhou!" });
        }
        await User.findByIdAndUpdate(user._id, {
            $set: {
              name,
              email,
              image
            }
          });
        res.status(200).send({ message: "Usuário atualizado com sucesso!" });
    } catch (err) {
        return res.status(400).send({ error: "Atualização do usuário falhou!" });
    }
});

router.post("/update-image", authMiddleware, async (req, res) => {
    try {
        return await upload(req, res, (err) => {
            if (err) {
                return res.status(400).send({error: "Erro ao fazer upload da imagem!"});
            }
            return res.status(200).send({message: 'Upload realizado com sucesso!', image: req.file.filename });
        });
    } catch(err) {
        return res.status(400).send({error: "Erro ao fazer upload da imagem!"});
    }
});

module.exports = app => app.use("/user", router);
