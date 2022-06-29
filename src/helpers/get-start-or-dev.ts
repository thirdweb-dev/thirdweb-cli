import got from "got/dist/source";

export const getStartOrDev = async (name: string) => {
  const { data } = await got
    .get(
      `https://raw.githubusercontent.com/thirdweb-example/${name}/main/package.json`,
    )
    .json();

  if (data?.scripts?.dev) {
    return "dev";
  }

  return "start";
};
