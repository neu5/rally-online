export function loginDialog() {
  const labelName = document.createElement("label");
  labelName.textContent = "Your display name (2-16 characters) ";
  const inputName = document.createElement("input");
  inputName.type = "text";
  labelName.appendChild(inputName);

  const inputSubmit = document.createElement("input");
  inputSubmit.type = "submit";
  labelName.appendChild(inputSubmit);

  return { labelName, inputName };
}
