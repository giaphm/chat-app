import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "~/components/ui/select"
 
import { usePathname,useRouter } from 'next-intl/client';


export default function SwitchLocale() {
  const router = useRouter();
  const pathname = usePathname() ?? '/';

  console.log("router", router);
  console.log("pathname", pathname);

  const handleSwitchLocale = (value: string) => {
    console.log("value", value);
    router.push(pathname, { locale: value })
  }

  return (
    <>
      <Select onValueChange={handleSwitchLocale}>
      <SelectTrigger className="w-[100px]">
        <SelectValue placeholder="Locale" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">EN</SelectItem>
        <SelectItem value="vn">VN</SelectItem>
      </SelectContent>
    </Select>
    </>
  )
}