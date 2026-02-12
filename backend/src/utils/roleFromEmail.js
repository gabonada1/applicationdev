function roleFromEmail(email) {
  const e = (email || "").toLowerCase().trim();

  // Admin emails
  if (e.endsWith("@student.buksu.edu.ph")) {
    return "admin";
  }

  // Regular users
  if (e.endsWith("@gmail.com")) {
    return "user";
  }

  return null; // Not allowed email domain
}

module.exports = roleFromEmail;
