// TODO: 에러 처리 방식 생각 후 수정 필요
class CustomErr extends Error {
  constructor(code, message, socket = null) {
    super(message);
    this.code = code;
    this.name = 'CustomErr';
    this.socket = socket;
  }
}

export default CustomErr;
