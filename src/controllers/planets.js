import Joi from "joi";
import pgPromise from "pg-promise";
import * as dotenv from "dotenv";
import passport from "passport";
import passportJWT from "passport-jwt";

const db = pgPromise()("postgres://postgres:postgres@localhost:5432/postgres");
console.log(db);

const setupDb = async () => {
  await db.none(`
   DROP TABLE IF EXISTS planets;

   CREATE TABLE planets(
      id SERIAL NOT NULL PRIMARY KEY,
      name TEXT NOT NULL,
      image TEXT
   );

  DROP TABLE IF EXISTS users;

  CREATE TABLE users (
  id SERIAL NOT NULL PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  token TEXT
);
`);

  await db.none(`INSERT INTO planets (name) VALUES ('Terra')`);
  await db.none(`INSERT INTO planets (name) VALUES ('marte')`);
};

setupDb();



dotenv.config();
const { SECRET } = process.env;

passport.use(
  new passportJWT.Strategy(
    {
      secretOrKey: SECRET,
      jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
    },
    async (payload, done) => {
      const user = db.one(`SELECT * FROM users WHERE id=$1`, payload.id);
      console.log(user);

      try {
        return user ? done(null, user) : done(new Error("User not found"));
      } catch (error) {
        done(error);
      }
    }
  )
);


const getAll = async (req, res) => {
  const planets = await db.many(`SELECT * FROM planets;`);
  res.status(200).json(planets);
};

const getOneById = async (req, res) => {
  const { id } = req.params;
  const planet = await db.oneOrNone(
    `SELECT * FROM planets WHERE id=$1;`,
    Number(id)
  );
  res.status(200).json(planet);
};

const planetSchema = Joi.object({
  id: Joi.number().integer(),
  name: Joi.string(),
});

const create = async (req, res) => {
  const { name } = req.body;
  const newPlanet = { name };
  const validatedNewPlanet = planetSchema.validate(newPlanet);

  if (validatedNewPlanet.error) {
    return res
      .status(400)
      .json({ msg: validatedNewPlanet.error.details[0].message });
  } else {
    await db.none("INSERT INTO planets (name) VALUES ($1)", name);
    res.status(201).json({ msg: "the planet was created" });
  }
};

const updateById = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  await db.none("UPDATE planets SET name=$2 WHERE id=$1", [id, name]);
  res.status(200).json({ msg: "the planet was updated" });
};

const deliteById = async (req, res) => {
  const { id } = req.params;
  await db.none("DELETE FROM planets WHERE id=$1", Number(id));
  res.status(200).json({ msg: "the planet was deleted" });
};

const createImage = async (req, res) => {
  console.log(req.file);
  const { id } = req.params;
  const filename = req.file?.path;

  if (filename) {
    db.none("UPDATE planets SET image=$2 WHERE id=$1", [id, filename]);
    res.status(201).json({ msg: "planet image uploaded successfully" });
  } else {
    res.status(400).json({ msg: "planet image failed to upload" });
  }
};

export { getAll, getOneById, create, updateById, deliteById, createImage, db };
