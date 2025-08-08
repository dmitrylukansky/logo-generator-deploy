module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    env: !!process.env.OPENAI_API_KEY,
  });
};
