import { NextResponse } from "next/server";
import {
  findApplicationByNoAndContact,
  findApplicationsByIdentity,
  findCertificationByNoAndContact,
  findCertificationsByIdentity,
  isSupabaseSchemaError,
  listPublicPaymentOrdersByApplicationNos,
  SupabaseConfigError,
  SupabaseRequestError
} from "@/lib/supabase/server";
import type { ApplicationQueryResponse, ApplicationQueryResult, ApplicationType } from "@/types/application";

const memberTypes: ApplicationType[] = ["personal_member", "organization_member"];
const legacyCertificationPrefix = ["ITCA", "C", ""].join("-");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "number";
  const applicationNo = searchParams.get("applicationNo")?.trim() || "";
  const contact = searchParams.get("contact")?.trim() || searchParams.get("email")?.trim() || "";

  if (mode !== "number") {
    const response: ApplicationQueryResponse = {
      success: false,
      message: "请使用申请编号和手机 / WhatsApp 或邮箱查询申请记录。"
    };

    return NextResponse.json(response, { status: 400 });
  }

  if (mode === "number" && (!applicationNo || !contact)) {
    const response: ApplicationQueryResponse = {
      success: false,
      message: "请填写申请编号和手机 / WhatsApp 或邮箱后再查询。"
    };

    return NextResponse.json(response, { status: 400 });
  }

  try {
    let applications: ApplicationQueryResult[] = [];

    if (mode === "number") {
      const normalizedApplicationNo = applicationNo.toUpperCase();
      const isCertification = normalizedApplicationNo.startsWith("ARID-ITCA-TAO-") || normalizedApplicationNo.startsWith("ITCA-TAO-") || normalizedApplicationNo.startsWith(legacyCertificationPrefix);
      const application = isCertification
        ? await findCertificationByNoAndContact(applicationNo, contact)
        : await findApplicationByNoAndContact(applicationNo, contact);

      applications = application ? [application] : [];
    } else {
      const applicationType = searchParams.get("applicationType")?.trim() || "";

      if (memberTypes.includes(applicationType as ApplicationType)) {
        const name = searchParams.get("name")?.trim() || "";
        const contactName = searchParams.get("contactName")?.trim() || "";

        if (!name || !contact || (applicationType === "organization_member" && !contactName)) {
          const response: ApplicationQueryResponse = {
            success: false,
            message: "请完整填写查询资料后再查询。"
          };

          return NextResponse.json(response, { status: 400 });
        }

        applications = await findApplicationsByIdentity({
          applicationType: applicationType as ApplicationType,
          name,
          contact,
          contactName: applicationType === "organization_member" ? contactName : undefined
        });
      } else if (applicationType === "taoist_certification") {
        const applicantName = searchParams.get("name")?.trim() || "";
        const taoistName = searchParams.get("taoistName")?.trim() || "";

        if (!applicantName || !taoistName || !contact) {
          const response: ApplicationQueryResponse = {
            success: false,
            message: "请完整填写查询资料后再查询。"
          };

          return NextResponse.json(response, { status: 400 });
        }

        applications = await findCertificationsByIdentity({ applicantName, taoistName, contact });
      }
    }

    if (applications.length === 0) {
      const response: ApplicationQueryResponse = {
        success: false,
        message: "未查询到匹配的申请记录。请确认申请编号和联系方式是否准确。"
      };

      return NextResponse.json(response, { status: 404 });
    }

    if (applications[0]?.recordDisposition === "voided") {
      const response: ApplicationQueryResponse = {
        success: false,
        message: "记录已作废，请联系秘书处"
      };

      return NextResponse.json(response, { status: 410 });
    }

    const paymentOrdersByApplicationNo = await listPublicPaymentOrdersByApplicationNos(applications.map((application) => application.applicationNo));
    applications = applications.map((application) => ({
      ...application,
      paymentOrders: paymentOrdersByApplicationNo.get(application.applicationNo) || []
    }));

    const response: ApplicationQueryResponse = {
      success: true,
      applications,
      application: applications[0]
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      const response: ApplicationQueryResponse = {
        success: false,
        message: "申请查询服务尚未完成系统配置，请联系协会秘书处协助核验。"
      };

      return NextResponse.json(response, { status: 500 });
    }

    if (isSupabaseSchemaError(error)) {
      const response: ApplicationQueryResponse = {
        success: false,
        message: "申请查询服务尚未完成系统配置，请联系协会秘书处协助核验。"
      };

      return NextResponse.json(response, { status: 500 });
    }

    if (error instanceof SupabaseRequestError) {
      const response: ApplicationQueryResponse = {
        success: false,
        message: "申请查询服务暂时无法访问数据库，请稍后重试。"
      };

      return NextResponse.json(response, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
    }

    const response: ApplicationQueryResponse = {
      success: false,
      message: "申请查询服务暂时不可用，请稍后重试。"
    };

    return NextResponse.json(response, { status: 500 });
  }
}
