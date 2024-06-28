module.exports = {
  apps: [
    {
      name: "mongodb-27017",
      script: "mongod",
      args: "--dbpath C:/Trabalho/ProjetosPessoais/better_end-backend/data/rs0 --replSet rs0 --bind_ip localhost --port 27017",
      exec_mode: "fork",
      instances: 1,
    },
    {
      name: "mongodb-27018",
      script: "mongod",
      args: "--dbpath C:/Trabalho/ProjetosPessoais/better_end-backend/data/rs0-1 --replSet rs0 --bind_ip localhost --port 27018",
      exec_mode: "fork",
      instances: 1,
    },
    {
      name: "mongodb-27019",
      script: "mongod",
      args: "--dbpath C:/Trabalho/ProjetosPessoais/better_end-backend/data/rs0-2 --replSet rs0 --bind_ip localhost --port 27019",
      exec_mode: "fork",
      instances: 1,
    },
  ],
};
