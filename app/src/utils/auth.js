export const saveUser = (data) => {
  localStorage.setItem("chatUser", JSON.stringify(data));
};

export const getUser = () => {
  const user = localStorage.getItem("chatUser");
  return user ? JSON.parse(user) : null;
};

export const logoutUser = () => {
  localStorage.removeItem("chatUser");
};
