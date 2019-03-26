import {API, StringInvoke} from "../../assembly/index";
import "allocator/arena";

declare function logStr(str: string): void;

class SelfAPI extends API {

    static getApi(): API {
        let invokeImpl = (ptr: i32, size: i32): i32 => {
            let resultPtr = memory.allocate(size + 4);

            let request = String.fromUTF8(ptr, size);

            let strLen: i32 = request.length;

            for (let i = 0; i < 4; i++) {
                let b: u8 = (strLen >> i * 8) as u8 & 0xFF;
                store<u8>(resultPtr + i, b);
            }

            let utf8ptr = request.toUTF8();
            let len = request.length;

            for (let i = 4; i < len + 4; i++) {
                store<u8>(resultPtr + i, load<u8>(utf8ptr + i - 4));
            }

            logStr("size: " + size.toString());


            return resultPtr;
        };

        let allocateImpl = (size: i32) :i32 => {
            return memory.allocate(size);
        };

        let deallocateImpl = (ptr: i32, size: i32): void => {
            memory.free(ptr);
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

export class CrossModuleTest {
    static shouldReturnRightResult(): bool {
        let stringInvoker = new StringInvoke(SelfAPI.getApi());
        let request = "some request hello";
        let response = stringInvoker.invoke(request);

        assert(request == response, ":(");
        return true;
    }
}
