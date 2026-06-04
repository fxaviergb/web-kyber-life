import { getScanExecutionsAction } from "@/app/actions/financial-scanner";

export default async function TestPage() {
    const res = await getScanExecutionsAction(1, 2);
    return (
        <pre>{JSON.stringify(res, null, 2)}</pre>
    )
}
