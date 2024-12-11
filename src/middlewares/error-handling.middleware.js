export default function (err, _, res, next) {
  // statusCode 가 전달되지 않은 경우 지정 외 에러이므로 500 할당
  const statusCode = err.code || 500;

  console.error(err);
  res.status(statusCode).json({
    errorMessage: statusCode === 500 ? '서버 내부 에러가 발생했습니다.' : err.message,
    statusCode: statusCode,
  });
}
