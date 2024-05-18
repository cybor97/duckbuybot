export async function waitTONRPSDelay() {
  await new Promise((resolve) =>
    setTimeout(resolve, parseInt(process.env.RPS_DELAY ?? "1000")),
  );
}
