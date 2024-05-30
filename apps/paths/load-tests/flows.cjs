
async function frontPageFlow(page, userContext, events) {
  const url = userContext.vars.target;
  await page.goto(url);
}

async function allPagesFlow(page, userContext, events) {
  const { vars } = userContext;
  const { target, path, title } = vars;
  const fullUrl = target + path;
  const response = await page.goto(fullUrl);
  if (response.status() !== 200) {
    events.emit('counter', `user.status_check_failed.${path}`, 1);
  } else {
    events.emit('counter', `user.status_check_ok.${path}`, 1);
  }

  /*
  const isElementVisible = await page.getByText(title).isVisible();

  if (!isElementVisible) {
    events.emit('counter', `user.element_check_failed.${title}`, 1);
  }
  */
  await page.reload();
}

module.exports = { frontPageFlow, allPagesFlow };
