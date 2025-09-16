const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// middlewere
app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      "https://car-doctor-server-project.web.app",
      "https://car-doctor-server-project.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tobpnew.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("car-doctor");
    const services = database.collection("services");
    const confirmdatabase = client
      .db("car-doctor")
      .collection("servicesconfirm");
    const products = client.db("car-doctor").collection("products");

    // token add some option
    const cookeoption = {
      httpOnly: true,
      secure: process.env.NODE_ENV==="production"?true:false,
      sameSite: process.env.NODE_ENV==="production"?"none":"strict"
    };

    // token JWT
    app.post("/jwt", async (req, res) => {
      const userdata = req.body;
      const token = jwt.sign(userdata, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      // console.log(userdata);
      // console.log(token);
      res.cookie("token", token,cookeoption).send({ success: true });
    });

    // clear token jwt
    app.post("/logout", async (req, res) => {
      res.clearCookie("token",{...cookeoption,maxAge:0}).send({ success: true});
    });

    // read all services data on database Mongobd
    app.get("/services", async (req, res) => {
      // console.log(req.cookies.token)
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);

      const cursor = services.find();
      const result = await cursor
        .skip(page * limit)
        .limit(limit)
        .toArray();
      res.send(result);
    });

    // read all products data on database Mongobd
    app.get("/products", async (req, res) => {
      const cursor = products.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // read singl or onedata on services data on database Mongodb
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await services.findOne(query);
      res.send(result);
    });

    // add service data on database
    app.post("/services", async (req, res) => {
      // console.log(req.cookies)
      const confirmdata = req.body;
      const result = await services.insertOne(confirmdata);
      res.send(result);
    });

    // verify token and i cread own middleware
    const verifyToken = async (req, res, next) => {
      const token = req.cookies?.token;
      // console.log(token);
      if (!token) {
        return res.status(401).send({ message: "not authorized" });
      }
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.user = decoded;
        next();
      });
    };

    // read all confirm data on database mongodb
    app.get("/confirm", verifyToken, async (req, res) => {
      // console.log(req.cookies)

      const email = req.query.email;
      const query = { email: email };
      // or
      // let query = {};
      // if(req.query?.email){
      //   query={email: req.query.email}
      // }
      // console.log(query);
      // console.log(email,req.user.email)

      if (email !== req.user.email) {
        return res.status(401).send({ message: "forbidden access" });
      }

      const result = await confirmdatabase.find(query).toArray();
      res.send(result);
    });

    // add confirm data on database
    app.post("/confirm", async (req, res) => {
      const confirmdata = req.body;
      const result = await confirmdatabase.insertOne(confirmdata);
      res.send(result);
    });

    // pegination all data count
    app.get("/servicescount", async (req, res) => {
      const count = await services.estimatedDocumentCount();
      // console.log(count)
      res.send({ count });
    });

    // peginatinon data load
    // app.get("/services", async (req, res) => {
    //   const page = parseInt(req.query.page) || 0;
    //   const limit = parseInt(req.query.limit) || 10;

    //   const services = await ServicesCollection.find()
    //     .skip(page * limit)
    //     .limit(limit)
    //     .toArray();

    //   res.send(services);
    // });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is Running on port ${port}`);
});
