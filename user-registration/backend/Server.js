// server.js (Backend)
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors'); // Pour gérer les problèmes de CORS
const Patient = require('../Frontend/my-app/src/models/Patient');


// Initialisation de l'application Express
const app = express();

// Middleware pour gérer les requêtes JSON et CORS
app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3000' })); // Permet d'accepter les requêtes du frontend React qui tourne sur http://localhost:3000

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/user_registration')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('Erreur de connexion MongoDB:', err));

// Création du modèle utilisateur avec Prénom, Username, Email et Password
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

// Route d'inscription (pour référence)
app.post('/register', async (req, res) => {
  const { firstName, username, email, password, confirmPassword } = req.body;

  if (!firstName || !username || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Les mots de passe ne correspondent pas." });
  }

  try {
    // Vérifier si l'email ou le nom d'utilisateur existent déjà
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "L'email ou le nom d'utilisateur est déjà utilisé." });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const newUser = new User({
      firstName,
      username,
      email,
      password: hashedPassword
    });

    // Sauvegarder l'utilisateur dans la base de données
    await newUser.save();

    res.status(201).json({ message: "Inscription réussie. Vous pouvez maintenant vous connecter." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
});

// Route de connexion
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe sont requis." });
    }
  
    try {
      // Chercher l'utilisateur par email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Utilisateur non trouvé." });
      }
  
      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Mot de passe incorrect." });
      }
  
      // Connexion réussie
      res.status(200).json({ message: "Connexion réussie", user });
    } catch (error) {
      console.error("Erreur de connexion:", error);
      res.status(500).json({ message: "Erreur du serveur" });
    }
  });
  // Routes pour gérer les patients

// Ajouter un patient
app.post('/patients', async (req, res) => {
  const { name, age, gender, disease } = req.body;

  if (!name || !age || !gender || !disease) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const newPatient = new Patient({
      name,
      age,
      gender,
      disease
    });

    await newPatient.save();
    res.status(201).json({ message: 'Patient ajouté avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur.' });
  }
});

app.put('/patients/:id', async (req, res) => {
  const { id } = req.params;
  const { name, age, gender, disease } = req.body;

  // Validation des données
  if (!name || !age || !gender || !disease) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  // Vérifier que l'ID est valide
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "L'ID du patient est invalide." });
  }

  try {
    // Rechercher le patient par son ID
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: "Patient non trouvé." });
    }

    // Mettre à jour le patient
    patient.name = name;
    patient.age = age;
    patient.gender = gender;
    patient.disease = disease;

    await patient.save();

    res.status(200).json({ message: "Patient mis à jour avec succès", patient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur.' });
  }
});



// Supprimer un patient
app.delete('/patients/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPatient = await Patient.findByIdAndDelete(id);

    if (!deletedPatient) {
      return res.status(404).json({ message: 'Patient non trouvé.' });
    }

    res.status(200).json({ message: 'Patient supprimé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur.' });
  }
});

// Obtenir tous les patients
app.get('/patients', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.status(200).json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur.' });
  }
});


// Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
