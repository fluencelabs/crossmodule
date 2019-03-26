export class API {

  invokeImpl: (ptr: i32, size: i32) => i32;
  allocateImpl: (size: i32) => i32;
  deallocateImpl: (ptr: i32, size: i32) => void;
  storeImpl: (ptr: i32, byte: u8) => void;
  loadImpl: (ptr: i32) => u8;

  constructor(
      invokeImpl: (ptr: i32, size: i32) => i32,
      allocateImpl: (size: i32) => i32,
      deallocateImpl: (ptr: i32, size: i32) => void,
      storeImpl: (ptr: i32, byte: u8) => void,
      loadImpl: (ptr: i32) => u8
  ) {
    this.invokeImpl = invokeImpl;
    this.allocateImpl = allocateImpl;
    this.deallocateImpl = deallocateImpl;
    this.storeImpl = storeImpl;
    this.loadImpl = loadImpl;
  }

  invoke(ptr: i32, size: i32): i32 {
    return this.invokeImpl(ptr, size);
  }

  allocate(size: i32) :i32 {
    return this.allocateImpl(size);
  }

  deallocate(ptr: i32, size: i32): void {
    this.deallocateImpl(size, size);
  }

  store(ptr: i32, byte: u8): void {
    this.storeImpl(ptr, byte);
  }

  load(ptr: i32): u8 {
    return this.loadImpl(ptr);
  }
}

export class ByteInvoke {

  api: API;

  constructor(api: API) {
    this.api = api;
  }

  getBytes(remotePtr: i32): Uint8Array {
    let lenBytes: u8[] = new Array(4);
    for (let i = 0; i < 4; i++) {
      lenBytes[i] = this.api.load(remotePtr + i);
    }

    let resultLen: i32 = 0;

    for (let i = 0; i < 4; i++) {
      resultLen = resultLen | (lenBytes[i] << (8*(i - 4) as u8))
    }

    let resultBytes = new Uint8Array(resultLen);

    for (let i = 0; i < resultLen; i++) {
      resultBytes[i] = this.api.load(remotePtr + i + 4);
    }

    this.api.deallocate(remotePtr, resultLen + 4);

    return resultBytes;
  }

  sendBytes(localPtr: i32, len: i32): i32 {
    let addr = this.api.allocate(len);

    for (let i = 0; i < len; i++) {
      let b: u8 = load<u8>(localPtr + i) as u8;
      this.api.store(addr + i, b);
    }

    return addr;
  }

  invoke(ptr: i32, len: i32): Uint8Array {
    let requestPtr = this.sendBytes(ptr, len);
    let resultPtr = this.api.invokeImpl(requestPtr, len);
    return this.getBytes(resultPtr);
  }
}

export class StringInvoke {

  byteInvoker: ByteInvoke;

  constructor(api: API) {
    this.byteInvoker = new ByteInvoke(api);
  }

  invoke(request: string): string {
    let utf8ptr = request.toUTF8();
    let len = request.length;

    let resultBytes = this.byteInvoker.invoke(utf8ptr, len);

    return String.fromUTF8(resultBytes.buffer.data, resultBytes.length);
  }
}
