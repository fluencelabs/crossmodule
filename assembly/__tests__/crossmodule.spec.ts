import {API, StringInvoke} from "../index";

class SelfAPI extends API {

  static getApi(): API {
    let invokeImpl = (ptr: i32, size: i32): i32 => {
      let resultPtr = __alloc(size + 4, 1);

      let request = String.UTF8.decodeUnsafe(ptr, size);

      let strBuf = Uint8Array.wrap(String.UTF8.encode(request));
      let strLen: i32 = request.length;

      for (let i = 0; i < 4; i++) {
        let b: u8 = (strLen >> i * 8) as u8 & 0xFF;
        store<u8>(resultPtr + i, b);
      }

      for (let i = 4; i < strLen + 3; i++) {
        store<u8>(resultPtr + i, strBuf[i - 4]);
      }

      return resultPtr;
    };

    let allocateImpl = (size: i32) :i32 => {
      return __alloc(size, 1);
    };

    let deallocateImpl = (ptr: i32, size: i32): void => {
      __free(ptr);
    };

    let storeImpl = (ptr: i32, byte: u8): void => {
      store<u8>(ptr, byte);
    };

    let loadImpl = (ptr: i32): u8 => {
      return load<u8>(ptr);
    };

    return new API(invokeImpl, allocateImpl, deallocateImpl, storeImpl, loadImpl);
  }
}

describe("crossmodule", () => {
  it("input should be equal to output", () => {
    let stringInvoker = new StringInvoke(SelfAPI.getApi());
    let request = "some request hello";
    let response = stringInvoker.invoke(request);

    log<string>("request: " + request);
    log<string>("response: " + response);

    expect<string>(request).toStrictEqual(response, "request is equal to response");
  });
});
