db = db.getSiblingDB("students");
db.runCommand({ create: "placeholder" });
db.placeholder.drop();
print("Base 'students' creada");