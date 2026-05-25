using Itca.Api.Data;
using Itca.Api.Features.Certificates;

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
builder.Services.AddScoped<CertificateQueries>();

var app = builder.Build();

app.UseCors(localNextJsCorsPolicy);

app.MapGet("/api/health", () => Results.Json(new
{
    status = "ok",
    service = "ITCA API"
}));

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

            return Results.Ok(certificate);
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
    }
);

app.Run();

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
