import { ProductService } from "@/application/services/product-service";

describe("Debug Crash", () => {
    it("should instantiate ProductService", () => {
        const mockRepo: any = {};
        const service = new ProductService(mockRepo, mockRepo, mockRepo);
        expect(service).toBeDefined();
    });
});
