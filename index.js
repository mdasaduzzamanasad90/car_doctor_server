const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// middlewere
app.use(cors());
app.use(express.json());

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
    await client.connect();

    const database = client.db("car-doctor");
    const services = database.collection("services");
    const confirmdatabase = client.db("car-doctor").collection("servicesconfirm");
    const products = client.db("car-doctor").collection("products");

    // read all services data on database Mongobd
    app.get("/services", async (req, res) => {
      const cursor = services.find();
      const result = await cursor.toArray();
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
    app.post("/services", async(req,res)=>{
      const confirmdata = req.body;
      const result = await services.insertOne(confirmdata);
      res.send(result);
    })

    // read all confirm data on database mongodb
    app.get("/confirm",async(req,res)=>{
      const email = req.query.email
      const query = {email:email}
      const result = await confirmdatabase.find(query).toArray();
      res.send(result);
    })

    // add confirm data on database
    app.post("/confirm", async(req,res)=>{
      const confirmdata = req.body;
      const result = await confirmdatabase.insertOne(confirmdata);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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
