using Itca.Api.Data;
using Itca.Api.Features.Applications;
using Itca.Api.Features.Certificates;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

const string localNextJsCorsPolicy = "LocalNextJs";

builder.Services.Configure<SupabasePostgresOptions>(
    builder.Configuration.GetSection(SupabasePostgresOptions.SectionName)
);
builder.Services.Configure<SupabaseStorageOptions>(
    builder.Configuration.GetSection(SupabaseStorageOptions.SectionName)
);

builder.Services.AddCors(options =>
{
    options.AddPolicy(localNextJsCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddSingleton<SupabaseDb>();
builder.Services.AddScoped<ApplicationQueries>();
builder.Services.AddScoped<ApplicationSubmissionService>();
builder.Services.AddScoped<CertificateQueries>();

var app = builder.Build();

app.UseCors(localNextJsCorsPolicy);

app.MapGet("/api/health", () => Results.Json(new
{
    status = "ok",
    service = "ITCA API"
}));

app.MapPost(
    "/api/member-applications",
    async (ApplicationSubmissionRequest? request, ApplicationSubmissionService submissions, CancellationToken cancellationToken) =>
    {
        return await SubmitApplicationAsync(
            () => submissions.SubmitMemberApplicationAsync(request, cancellationToken)
        );
    }
);

app.MapPost(
    "/api/organization-applications",
    async (ApplicationSubmissionRequest? request, ApplicationSubmissionService submissions, CancellationToken cancellationToken) =>
    {
        return await SubmitApplicationAsync(
            () => submissions.SubmitOrganizationApplicationAsync(request, cancellationToken)
        );
    }
);

app.MapGet(
    "/api/applications/query",
    async (
        string? mode,
        string? applicationNo,
        string? contact,
        string? email,
        ApplicationQueries queries,
        CancellationToken cancellationToken
    ) =>
    {
        var normalizedMode = string.IsNullOrWhiteSpace(mode) ? "number" : mode.Trim();
        var normalizedApplicationNo = applicationNo?.Trim() ?? string.Empty;
        var normalizedContact = contact?.Trim() ?? email?.Trim() ?? string.Empty;

        if (normalizedMode != "number")
        {
            return Results.BadRequest(new
            {
                success = false,
                message = "请使用申请编号和手机 / WhatsApp 或邮箱查询申请记录。"
            });
        }

        if (string.IsNullOrWhiteSpace(normalizedApplicationNo) || string.IsNullOrWhiteSpace(normalizedContact))
        {
            return Results.BadRequest(new
            {
                success = false,
                message = "请填写申请编号和手机 / WhatsApp 或邮箱后再查询。"
            });
        }

        try
        {
            var application = await queries.FindApplicationProgressAsync(
                normalizedApplicationNo,
                normalizedContact,
                cancellationToken
            );

            if (application is null)
            {
                return Results.NotFound(new
                {
                    success = false,
                    message = "未查询到匹配的申请记录。请确认申请编号和联系方式是否准确。"
                });
            }

            return Results.Ok(new
            {
                success = true,
                applications = new[] { application },
                application
            });
        }
        catch (SupabaseDbConfigurationException error)
        {
            return Results.Json(
                new
                {
                    success = false,
                    message = "申请查询服务尚未完成数据库配置，请联系协会秘书处协助核验。",
                    missingConfiguration = error.EnvironmentVariable
                },
                statusCode: StatusCodes.Status503ServiceUnavailable
            );
        }
        catch (ArgumentException)
        {
            return Results.Json(
                new
                {
                    success = false,
                    message = "申请查询服务的数据库连接配置格式无效。"
                },
                statusCode: StatusCodes.Status503ServiceUnavailable
            );
        }
        catch (NpgsqlException)
        {
            return Results.Json(
                new
                {
                    success = false,
                    message = "申请查询服务暂时无法连接数据库，请稍后再试。"
                },
                statusCode: StatusCodes.Status503ServiceUnavailable
            );
        }
    }
);

app.MapGet(
    "/api/certificates/query",
    async (string? certificateNo, string? holderName, CertificateQueries queries, CancellationToken cancellationToken) =>
    {
        var normalizedCertificateNo = certificateNo?.Trim() ?? string.Empty;
        var normalizedHolderName = holderName?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(normalizedCertificateNo) || string.IsNullOrWhiteSpace(normalizedHolderName))
        {
            return Results.BadRequest(new
            {
                success = false,
                message = "请填写证书编号和持证人姓名后再查询。"
            });
        }

        try
        {
            var certificate = await queries.FindPublicCertificateAsync(normalizedCertificateNo, normalizedHolderName, cancellationToken);

            if (certificate is null)
            {
                return Results.NotFound(new
                {
                    success = false,
                    message = "未查询到匹配证书记录。请确认证书编号和持证人姓名是否准确。"
                });
            }

            return Results.Ok(new
            {
                success = true,
                certificate
            });
        }
        catch (SupabaseDbConfigurationException error)
        {
            return Results.Json(
                new
                {
                    success = false,
                    message = "证书公开查询服务尚未完成数据库配置。",
                    missingConfiguration = error.EnvironmentVariable
                },
                statusCode: StatusCodes.Status503ServiceUnavailable
            );
        }
        catch (ArgumentException)
        {
            return Results.Json(
                new
                {
                    success = false,
                    message = "证书公开查询服务的数据库连接配置格式无效。"
                },
                statusCode: StatusCodes.Status503ServiceUnavailable
            );
        }
        catch (NpgsqlException)
        {
            return Results.Json(
                new
                {
                    success = false,
                    message = "证书公开查询服务暂时无法连接数据库，请稍后再试。"
                },
                statusCode: StatusCodes.Status503ServiceUnavailable
            );
        }
    }
);

app.MapGet(
    "/api/certificates/{certificateNo}",
    async (string? certificateNo, CertificateQueries queries, CancellationToken cancellationToken) =>
    {
        var normalizedCertificateNo = certificateNo?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(normalizedCertificateNo))
        {
            return Results.BadRequest(new
            {
                success = false,
                message = "请提供证书编号后再核验。"
            });
        }

        try
        {
            var certificate = await queries.FindPublicCertificateByNoAsync(normalizedCertificateNo, cancellationToken);

            if (certificate is null)
            {
                return Results.NotFound(new
                {
                    success = false,
                    message = "未查询到对应公开核验证书记录。"
                });
            }

            return Results.Ok(new
            {
                success = true,
                certificate
            });
        }
        catch (SupabaseDbConfigurationException error)
        {
            return Results.Json(
                new
                {
                    success = false,
                    message = "证书公开核验详情服务尚未完成数据库配置。",
                    missingConfiguration = error.EnvironmentVariable
                },
                statusCode: StatusCodes.Status503ServiceUnavailable
            );
        }
        catch (ArgumentException)
        {
            return Results.Json(
                new
                {
                    success = false,
                    message = "证书公开核验详情服务的数据库连接配置格式无效。"
                },
                statusCode: StatusCodes.Status503ServiceUnavailable
            );
        }
        catch (NpgsqlException)
        {
            return Results.Json(
                new
                {
                    success = false,
                    message = "证书公开核验详情服务暂时无法连接数据库，请稍后再试。"
                },
                statusCode: StatusCodes.Status503ServiceUnavailable
            );
        }
    }
);

app.Run();

static async Task<IResult> SubmitApplicationAsync(Func<Task<ApplicationSubmissionResult>> submit)
{
    try
    {
        var result = await submit();

        return Results.Ok(new
        {
            success = true,
            applicationNo = result.ApplicationNo,
            applicationType = result.ApplicationType,
            status = result.Status
        });
    }
    catch (ApplicationValidationException error)
    {
        return Results.BadRequest(new
        {
            success = false,
            message = error.Message,
            fieldErrors = error.FieldErrors
        });
    }
    catch (OpenApplicationAlreadyExistsException)
    {
        return Results.Json(
            new
            {
                success = false,
                message = "系统检测到您已提交过相关申请，请使用申请编号查询进度。如需补充或更正资料，请联系协会秘书处。"
            },
            statusCode: StatusCodes.Status409Conflict
        );
    }
    catch (SupabaseDbConfigurationException error)
    {
        return Results.Json(
            new
            {
                success = false,
                message = "申请提交服务尚未完成数据库配置，请联系协会秘书处。",
                missingConfiguration = error.EnvironmentVariable
            },
            statusCode: StatusCodes.Status503ServiceUnavailable
        );
    }
    catch (ArgumentException)
    {
        return Results.Json(
            new
            {
                success = false,
                message = "申请提交服务的数据库连接配置格式无效。"
            },
            statusCode: StatusCodes.Status503ServiceUnavailable
        );
    }
    catch (NpgsqlException)
    {
        return Results.Json(
            new
            {
                success = false,
                message = "申请提交服务暂时无法连接数据库，请稍后再试。"
            },
            statusCode: StatusCodes.Status503ServiceUnavailable
        );
    }
}

public sealed class SupabasePostgresOptions
{
    public const string SectionName = "Supabase:Postgres";

    public string? ConnectionString { get; set; }
}

public sealed class SupabaseStorageOptions
{
    public const string SectionName = "Supabase:Storage";

    public string? Url { get; set; }

    public string? Bucket { get; set; }

    public string? ServiceRoleKey { get; set; }
}
