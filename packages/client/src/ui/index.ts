export const createList = (
  el: HTMLElement,
  list: Array<{ data: { name: string } }>
) => {
  const fragment = new DocumentFragment();

  list.forEach(({ data }) => {
    const li = document.createElement("li");
    li.textContent = data.name;
    li.dataset.id = data.name;

    fragment.appendChild(li);
  });

  el.textContent = "";
  el.appendChild(fragment);
};
