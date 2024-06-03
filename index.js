const express = require('express');
const jwt = require("jsonwebtoken")
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 2000;

// Middleware
app.use(cors());
app.use(express.json());


// JWT Token

const CreateToken = (user) => {
  const token = jwt.sign({
    eamil: user.email
  },
    process.env.ACCESS_TOKEN,
    { expiresIn: '1h' }
  );
  return token;
}

// Verify Token
const verifyToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' })
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
    if (error) {  
      return res.status(403).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded
  });
  next();
}






const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z50rydu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const itemCollection = client.db('fruit_brust').collection('all_fruit');
    const cartCollection = client.db('fruit_brust').collection('carts');
    const usersCollection = client.db('fruit_brust').collection('users');


    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: '1h'
      })
      res.send({ token, status: 'success' });
    })

    app.get('/items', async (req, res) => {
      const id = req.query.id;
      if (!id) {
        const cursor = itemCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      }
      else if (id) {
        const query = { _id: new ObjectId(id) };
        const result = await itemCollection.find(query).toArray();
        res.send(result);
      }
      else {
        res.send([])
      }
    })

    app.post('/items', verifyToken, async (req, res) => {
      const item = req.body;
      const result = await itemCollection.insertOne(item);
      res.send(result);
    })
    app.patch('/items', verifyToken, async (req, res) => {
      const id = req.query.id;
      const query = { _id: new ObjectId(id) };
      const item = req.body;
      const updateDocument = {
        $set: {
          name: item.name,
          price: item.price,
          rating: item.rating,
          category: item.category,
          description: item.description,
          imported_country: item.imported_country,
          available_quantity: item.available_quantity,
          image_url: item.image_url
        }
      }
      const result = await itemCollection.updateOne(query, updateDocument)
      res.send(result);
    })
    app.delete('/items', verifyToken, async (req, res) => {
      const id = req.query.id;
      const query = { _id: new ObjectId(id) };
      const result = await itemCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/users', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([])
      }
      const query = { email: email };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([])
      }
      const query = { user_email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/users', async (req, res) => {
      const userData = req.body;
      const email = userData.email;
      const query = { email: email }
      const isUserExist = await usersCollection.findOne(query);
      if (isUserExist) {
        return res.send({
          status: "success",
          message: "Login Success",
          email: email
        });
      }
      else {
        await usersCollection.insertOne(userData);
        return res.send({
          status: "success",
          message: "Login Success",
          email: email
        })
      }
    })



    app.post('/carts', verifyToken, async (req, res) => {
      const cartData = req.body;
      const result = await cartCollection.insertOne(cartData);
      res.send(result)
    })

    app.delete('/carts', verifyToken, async (req, res) => {
      const itemId = req.query.id;
      const query = { _id: new ObjectId(itemId) };
      const result = await cartCollection.deleteOne(query);
      res.send(result)
    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Welcome to onePageProject Server')
})

app.listen(port, () => {
  console.log(`Thei server is running on port ${port}`)
})